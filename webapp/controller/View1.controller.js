sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/Fragment'
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, JSONModel, Filter, FilterOperator, Fragment) {
		"use strict";

		return Controller.extend("project1.controller.View1", {

            tableName: "peliculasTable",
            collRefPeliculas: null,

			onInit: function () {
                // Get the Firebase Model
                const firebaseModel = this.getOwnerComponent().getModel("firebase");
                        
                // Create a Firestore reference
                const firestore = firebaseModel.getData().firestore;
                // Create a collection reference to the collection
                this.collRefPeliculas = firestore.collection("peliculaSet");

                // Initialize an array of the collection as an object
                var oPeliculas = {
                    peliculas: []
                };
                        
                // Create and set the created object to the the model
                var peliculaModel = new JSONModel(oPeliculas);
                this.getView().setModel(peliculaModel);

                // Get single set once
                //this.getPeliculas();

                this.getRealTimePeliculas();
            },
            
            getPeliculas : function() {
                this.collRefPeliculas.get().then(
                    function (collection) {
                        var peliculaModel = this.getView().getModel();
                        var peliculaData = peliculaModel.getData();
                        var peliculas = collection.docs.map(function (docPelicula) {
                                    return docPelicula.data();
                                });
                        peliculaData.peliculas = peliculas;
                        this.getView().byId(this.tableName).getBinding("items").refresh();
                }.bind(this));
            },

            getRealTimePeliculas: function () {
                // The onSnapshot the keep the data up to date in case of added, 
                // modified or removed data in the Firestore database
                this.collRefPeliculas.onSnapshot(function (snapshot) {
                    // Get the model
                    var peliculaModel = this.getView().getModel();
                    // Get all data
                    var peliculaData = peliculaModel.getData();
                            
                    // Get the current added/modified/removed document
                    // of the collection
                    snapshot.docChanges().forEach(function (change) {
                        // set id (to know which document is modifed and
                        // replace it on change.Type == modified) 
                        // and data of firebase document
                        var oPelicula = change.doc.data();
                        oPelicula.id = change.doc.id;

                        // Added document (shipment) add to arrat
                        if (change.type === "added") {
                            peliculaData.peliculas.push(oPelicula);
                        } 
                        // Modified document (find its index and change current doc 
                        // with the updated version)
                        else if (change.type === "modified") {
                            var index = peliculaData.peliculas.map(function (pelicula) {
                                    return pelicula.id;
                                    }).indexOf(oPelicula.id);
                            peliculaData.peliculas[index] = oPelicula;
                        } 
                        // Removed document (find index and remove it from the array)
                        else if (change.type === "removed") {
                            var index = peliculaData.peliculas.map(function (pelicula) {
                                    return pelicula.id;
                                    }).indexOf(oPelicula.id);
                            peliculaData.peliculas.splice(index, 1);
                        }
                    });
                            
                    //Refresh your model and the binding of the items in the table
                    this.getView().getModel().refresh(true);
                    this.getView().byId(this.tableName).getBinding("items").refresh();
                }.bind(this));
            },
            
            onSearch : function (oEvent) {
                if (oEvent.getParameters().refreshButtonPressed) {
                    // Search field's 'refresh' button has been pressed.
                    // This is visible if you select any master list item.
                    // In this case no new search is triggered, we only
                    // refresh the list binding.
                    this.onRefresh();
                } else {
                    var aTableSearchState = [];
                    var sQuery = oEvent.getParameter("query");

                    if (sQuery && sQuery.length > 0) {
                        aTableSearchState = [new Filter("titulo", FilterOperator.Contains, sQuery)];
                    }
                    this._applySearch(aTableSearchState);
                }

            },

            /**
             * Event handler for refresh event. Keeps filter, sort
             * and group settings and refreshes the list binding.
             * @public
             */
            onRefresh : function () {
                var oTable = this.byId(this.tableName);
                oTable.getBinding("items").refresh();
            },

            /**
             * Internal helper method to apply both filter and search state together on the list binding
             * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
             * @private
             */
            _applySearch: function(aTableSearchState) {
                var oTable = this.byId(this.tableName)
                oTable.getBinding("items").filter(aTableSearchState, "Application");
            },

            /**
             * Event handler when a table item gets pressed
             * @param {sap.ui.base.Event} oEvent the table selectionChange event
             * @public
             */
            onPress : function (oEvent) {
                // The source is the list item that got pressed
                this._showObject(oEvent.getSource());
            },

            /**
             * Shows the selected item on the object page
             * On phones a additional history entry is created
             * @param {sap.m.ObjectListItem} oItem selected Item
             * @private
             */
            _showObject : function (oItem) {
                this.getOwnerComponent().getRouter().navTo("object", {
                    objectId: oItem.getBindingContext().getProperty("id")
                });
            },

            loadFragment : function() {
                var oPage = this.byId("vBox"),
                    oView = this.getView();

                var worklist = this;
                var oFragmentController = {
                    addFilm : function() {
                        if(!this.checkInputs())
                            return;

                        var film = this.getFilmData();
                        worklist.collRefPeliculas.add(film);
                        worklist.byId("form").setVisible(false);
                        this.clearForm();
                    },

                    getFilmData : function() {
                        return {
                            titulo: worklist.byId("inputTitulo").getValue(),
                            autor: worklist.byId("inputAutor").getValue(),
                            anio: worklist.byId("inputAnio").getValue(),
                            caratula: worklist.byId("inputCaratula").getValue(),
                        }
                    },

                    clearForm : function() {
                        worklist.byId("inputTitulo").setValue("");
                        worklist.byId("inputAutor").setValue("");
                        worklist.byId("inputAnio").setValue("");
                        worklist.byId("inputCaratula").setValue("");
                    },

                    checkInputs : function() {
                        var titulo = this.checkInput("inputTitulo");
                        var anio = this.checkInput("inputAnio");
                        var caratula = this.checkInput("inputCaratula");
                        return titulo && anio && caratula;

                    },
                    
                    checkInput : function(inputName) {
                        var value = worklist.byId(inputName).getValue();
                        if(value === "") {
                            worklist.byId(inputName).setValueState(sap.ui.core.ValueState.Error);
                            return false;
                        } else {
                            worklist.byId(inputName).setValueState(sap.ui.core.ValueState.None);
                            return true;
                        }
                    }
                };

                var pFormFragment = Fragment.load({
                        id: oView.getId(),
                        name: "project1.view.NewFilm",
                        controller: oFragmentController
                    }).then(function(oVBox){
                        oPage.addItem(oVBox);
                });
            },

            showFragment : function() {
                if(this.fragmentActivo) {
                    this.byId("form").setVisible( !this.byId("form").getVisible());
                    return;
                }

                this.fragmentActivo = true;
                this.loadFragment();
            },

            openAPIView : function() {
                this.getOwnerComponent().getRouter().navTo("apiView", {});
            }
		});
	});
