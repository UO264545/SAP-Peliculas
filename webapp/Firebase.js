sap.ui.define([
	"sap/ui/model/json/JSONModel",
], function (JSONModel) {
	"use strict";
	
	// Firebase-config retrieved from the Firebase-console
	const firebaseConfig = {
		apiKey: "AIzaSyBkYt25zy26nR07ARKdmax_avQ-SAntuyw",
        authDomain: "sap-peliculas.firebaseapp.com",
        projectId: "sap-peliculas",
        storageBucket: "sap-peliculas.appspot.com",
        messagingSenderId: "959090470457",
        appId: "1:959090470457:web:235fc36c937e2c1df067e8"
	};

	return {
		initializeFirebase: function () {
			// Initialize Firebase with the Firebase-config
			firebase.initializeApp(firebaseConfig);
			
			// Create a Firestore reference
			const firestore = firebase.firestore();
			
			// Firebase services object
			const oFirebase = {
				firestore: firestore
			};
			
			// Create a Firebase model out of the oFirebase service object which contains all required Firebase services
			var fbModel = new JSONModel(oFirebase);
			
			// Return the Firebase Model
			return fbModel;
		}
	};
});