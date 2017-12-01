/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";
module.exports = {
	initExpress: function() {
		var xsenv = require("@sap/xsenv");
		var passport = require("passport");
		var xssec = require("@sap/xssec");
		var xsHDBConn = require("@sap/hdbext");
		var express = require("express");

		//logging
		var logging = require("@sap/logging");
		var appContext = logging.createAppContext();

		//Initialize Express App for XS UAA and HDBEXT Middleware
		var app = express();
		//configure HANA 
		var options = Object.assign({
				redirectUrl: "/index.xsjs"
			},
			xsenv.getServices({
				uaa: {
					tag: "xsuaa"
				}
			})
		);
		// Authentication Module Configuration
		passport.use("JWT", new xssec.JWTStrategy(options.uaa));
		app.use(logging.expressMiddleware(appContext));
		app.use(passport.initialize());
		// var options = xsenv.getServices({
		// 	hana: "CROSS_SCHEMA_SYS"
		// });
		 options = xsenv.getServices({
			hana: "TBRS_CSP-grantor"
		});
		options.hana.rowsWithMetadata = true;
		
		app.use(
			passport.authenticate("JWT", {
				session: false
			}),
			xsHDBConn.middleware(options.hana));

		return app;
	}
};