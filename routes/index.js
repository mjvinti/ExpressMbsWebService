var express = require('express');
var router = express.Router();
var ibmdb = require('ibm_db');

const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { pageTitle: 'MBS Web Service' });
});

router.get('/results', [
	check('id', 'Document number must not be empty').isLength({ min: 1 }).trim(),
	sanitize('id').trim().escape()
], function(req, res, next) {

	var docnbrInput = req.query.id.trim();
	var docnbrQuery = `select a.doc_nbr,max(a.rev) \
		from wds01.dsh_table a, wds01.dmr_table b \
		where b.doc_nbr = '${docnbrInput}' \
		and b.doc_nbr = a.doc_nbr \
		and date_rel > 0 \
		group by a.doc_nbr \
		with ur`;
	var latestRev;
	var docnbrDisp;

	ibmdb.open('DATABASE=<database>;HOSTNAME=<hostname>;UID=<username>;PWD=<password>;PORT=<portnumber>;PROTOCOL=TCPIP', function(err, conn) {
		if (err) { return next(err) };
		console.log('Connected to DB2...');

		conn.query(docnbrQuery, function(err, data) {
			if (err) { return next(err); }
			else if (data.length === 0) {
				res.render('mbs_detail', {
					title: 'MBS Detail Page',
					docnbrDisp: docnbrInput,
					latestRev: 'Not found. Did you enter the correct document number?'
				});
			} else  {
				docnbrDisp = data[0]['DOC_NBR'].trim();
				latestRev = data[0]['2'].trim();
				res.render('mbs_detail', { 
					title: 'MBS Detail Page',
					docnbrDisp: docnbrDisp ,
					latestRev: latestRev });
			} 

			conn.close(function() {
				console.log('Connection closed');
			});
		});
	});
});

module.exports = router;