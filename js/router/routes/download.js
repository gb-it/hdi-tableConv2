/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, consistent-return: 0, new-cap: 0*/
"use strict";
var express = require("express");

module.exports = {
	router: function() {
		var app = require("express").Router();
		app.get("/:schema/:type?/:table?/", function(req, res) {
			var outString = '';
			var type = req.params.type;
			if (typeof type === "undefined" || type === null || type === "") {
				type = "txt";
			}
			if (!(type === "txt" || type === "zip" || type === 'sql')) {
				res.type("text/plain").status(500).send("ERROR: " + "Unknown Output Format Requested");
				return;
			}
			var zip = new require("node-zip")();

			require(global.__base + "router/routes/tables").getTables(req.params.schema, req.params.table, req.db, null, function(err,
				tablesJSON) {
				require("async").each(tablesJSON, function(table, callback) {
					if (type === 'sql') {
						require(global.__base + "router/routes/hdbtable").getHDBTable(table.TABLE_OID.toString(), req.db, function(err, results) {
							if (err) {
								callback(err);
							} else {
								zip.file(table.TABLE_NAME.toString() + ".hdbtable", results + '\n\n');
								callback();
							}
						});
					} else {
						require(global.__base + "router/routes/hdbcds").getHDBCDS(table.TABLE_OID.toString(), req.db, function(err, results) {
							if (err) {
								callback(err);
							} else {
								if (type === 'zip') {
									zip.file(table.TABLE_NAME.toString() + ".txt", results + '\n\n');
									callback();
								} else {
									outString += results + '\n\n';
									callback();
								}
							}
						});
					}
				}, function(err) {
					if (err) {
						res.type("text/plain").status(500).send("ERROR: " + err);
					} else {
						if (type === 'zip') {
							var data = zip.generate({
								base64: false,
								compression: "DEFLATE"
							});
							res.header("Content-Disposition", "attachment; filename=ConversionHDBCDS.zip");
							res.type("application/zip").status(200).send(new Buffer(data, "binary"));
						} 
						if (type === 'sql') {
							var data2 = zip.generate({
								base64: false,
								compression: "DEFLATE"
							});
							res.header("Content-Disposition", "attachment; filename=ConversionHDBTable.zip");
							res.type("application/zip").status(200).send(new Buffer(data2, "binary"));
						}
						if (type === 'txt') {
							res.header("Content-Disposition", "attachment; filename=ConversionHDBCDS.txt");
							res.type("application/octet-stream").status(200).send(outString);
						}

					}
				});

			});
		});
		return app;
	}
};