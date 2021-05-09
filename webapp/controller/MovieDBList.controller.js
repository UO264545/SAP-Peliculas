sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    'sap/m/MessageToast'
], function (Controller, JSONModel, History, MessageToast) {
	"use strict";

	return Controller.extend("project1.controller.Object", {

        baseImageURL: "https://image.tmdb.org/t/p/w500",
        collRefPeliculas: null,
        collRefActores: null,
        oModel: new JSONModel({
            page: 1,
            totalPages: 0
        }),

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
            // Get the Firebase Model
            const firebaseModel = this.getOwnerComponent().getModel("firebase");
                    
            // Create a Firestore reference
            const firestore = firebaseModel.getData().firestore;
            // Create a collection reference to the collection
            this.collRefPeliculas = firestore.collection("peliculaSet");
            this.collRefActores = firestore.collection("actorSet");

            this.getView().setModel(this.oModel, "info");
            this.loadMoviesFromAPI();
        },

        loadMoviesFromAPI : function() {
            var movieDBList = this;
            var page = this.oModel.getData().page;
            // Carga las peliculas populares de la semana
            $.ajax({
                url: "https://api.themoviedb.org/3/trending/movie/week?api_key=8c4a363c5d3f11200c74ee5e0122a907&language=es&page=" + page,
                success: function(sResult) {
                    movieDBList.oModel.getData().totalPages = sResult.total_pages;
                    movieDBList.oModel.refresh();

                    var peliculas = sResult.results.map( (peli) => {
                        var inMyList;
                        return {
                            idMovieDB: peli.id,
                            titulo: peli.title,
                            anio: peli.release_date.substring(0, 4),
                            caratula: movieDBList.baseImageURL + peli.poster_path,
                            rating: peli.vote_average
                        }
                    });
                    movieDBList.getView().getModel().getData().peliculasAPI = peliculas;
                    movieDBList.showMovies();
                }
            });
        },

        showMovies : function() {
            var movieDBList = this;
            this.getView().getModel().getData().peliculasAPI.forEach(function(peli) {
                movieDBList.collRefPeliculas.where("titulo", "==", peli.titulo).get()
                    .then( (result) => {
                        peli.inMyList = !result.empty;
                        if(!result.empty) {
                            peli.id = result.docs[0].id;
                        }

                        movieDBList.getView().getModel().refresh()
                    });
            });
        },

        setFavorite : function(oEvent) {
            var peliculaContext = oEvent.getSource().getBindingContext();

            var index = peliculaContext.getPath().split("/")[2];
            var inList = peliculaContext.getProperty("inMyList");
            this.getView().getModel().getData().peliculasAPI[index].inMyList = !inList;
            this.getView().getModel().refresh();

            if(inList){
                this.deleteFromDatabase(peliculaContext.getProperty("id"));
                return;
            }

            var pelicula = {
                titulo: peliculaContext.getProperty("titulo"),
                anio: peliculaContext.getProperty("anio"),
                caratula: peliculaContext.getProperty("caratula")
            }
            
            var view = this;
            this.addToDatabase(pelicula, peliculaContext.getProperty("idMovieDB"), 
                (id) => {
                    view.getView().getModel().getData().peliculasAPI[index].id = id;
                    view.getView().getModel().refresh();
                });
        },

        addToDatabase(pelicula, idMovieDB, updateID) {
            var movieDBList = this;
            this.collRefPeliculas.add(pelicula).then( (result) => {
                var idPelicula = result.id;
                updateID(idPelicula);
                MessageToast.show("Pelicula añadida a tu lista")
                movieDBList.addActores(idMovieDB, idPelicula);
            });
        },

        addActores(idMovieDB, idPelicula) {
            var movieDBList = this;
            $.ajax({
                url: "https://api.themoviedb.org/3/movie/" + idMovieDB + "/credits?api_key=8c4a363c5d3f11200c74ee5e0122a907&language=es",
                success: function(sResult) {
                    var actores = sResult.cast.filter((actor) => actor.known_for_department === "Acting") // Solo actores
                        .sort((a, b) => b.popularity - a.popularity) // Ordenar por popularidad
                        .slice(0, 3) // Coger solo una parte
                        .map( (actor) => {
                            return {
                                idPelicula: idPelicula,
                                nombre: actor.name.split(" ")[0],
                                apellidos: actor.name.split(" ")[1]
                            }
                        })
                    actores.forEach((actor) => {
                        movieDBList.collRefActores.add(actor)
                    })
                }
            });
        },

        deleteFromDatabase : function(id) {
            this.collRefPeliculas.doc(id).delete().
                then(() => MessageToast.show("Pelicula quitada de tu lista"));

            var temp = this;
            this.collRefActores.where("idPelicula", "==", id).get()
                .then((result) => {
                    result.docs.forEach((actor) => {
                        temp.collRefActores.doc(actor.id).delete();
                    })
                });
        },

        onPrevious : function() {
            this.changePage(-1);
        },

        onNext : function() {
            this.changePage(1);
        },

        changePage : function(direction) {
            this.getView().getModel().getData().peliculasAPI = {};
            this.getView().getModel().refresh();

            this.oModel.getData().page = this.oModel.getData().page + direction;
            this.oModel.refresh();
            this.loadMoviesFromAPI();
        },

        onNavBack : function() {
			//var oHistory = History.getInstance();
			//var sPreviousHash = oHistory.getPreviousHash();

			//if (sPreviousHash !== undefined) {
            //    window.history.go(-1);
			//} else {
			//	var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            //    oRouter.navTo("RouteView1", true);
			//}
			this.getOwnerComponent().getRouter().navTo("RouteView1", {}, true);
			
        }
    })
});