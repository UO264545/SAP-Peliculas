// @ts-nocheck
// @ts-ignore
sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History"
], function (Controller, JSONModel, History) {
	"use strict";

	return Controller.extend("project1.controller.Object", {

        collRefPeliculas: null,
        collRefActores: null,
        oModel: new JSONModel({
            titulo: "Cargando...",
            anio: "Cargando...",
            caratula: ""
        }),
        
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
            this.getOwnerComponent().setModel(this.oModel, "pelicula");

            // Get the Firebase Model
            const firebaseModel = this.getOwnerComponent().getModel("firebase");
            
            // Create a Firestore reference
            const firestore = firebaseModel.getData().firestore;

            // Create a collection reference to the collection
            this.collRefPeliculas = firestore.collection("peliculaSet");
            this.collRefActores = firestore.collection("actorSet");

            this.getOwnerComponent().getRouter().getRoute("object")
                .attachPatternMatched(this._onObjectMatched, this);
		},

        _onObjectMatched: function (oEvent) {
            let id  = window.decodeURIComponent(oEvent.getParameter("arguments").objectId);
            this.getDatosPelicula(id);
            this.getActores(id);
		},

        getDatosPelicula(id) {
            let docRef = this.collRefPeliculas.doc(id);
            let objectView = this;
            docRef.get().then((doc) => {
                objectView.oModel.setData(doc.data());
                objectView.oModel.refresh();
            });
        },

        getActores(id) {
            let objectView = this;
            this.collRefActores.where("idPelicula", "==", id)
                .get().then( (snapshot) => {
                    var actoresModel = this.getView().getModel();
                    var actorData = actoresModel.getData();
                    var actores = snapshot.docs.map( (docActor) => docActor.data() );
                    actorData.actores = actores;
                    this.getView().byId("table").getBinding("items").refresh();
                });
        },

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
			
		}

	});

});