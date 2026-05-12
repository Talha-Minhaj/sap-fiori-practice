sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/ValueState",
    "products/formatter/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox, ValueState, formatter) {
        "use strict";

        var API_URL = "http://localhost:3001/products";

        return Controller.extend("products.controller.MainView", {

            formatter: formatter,

            onInit: function () {
                // Create a JSONModel and set it as the default model
                var oModel = new JSONModel({
                    products: [],
                    productCount: 0
                });
                this.getView().setModel(oModel);

                // Load products on startup
                this._loadProducts();
            },

            /* ============================================= */
            /* Data Loading (READ)                           */
            /* ============================================= */

            _loadProducts: function () {
                var oModel = this.getView().getModel();
                var oTable = this.byId("productsTable");
                oTable.setBusy(true);

                var that = this;

                fetch(API_URL)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("HTTP " + response.status);
                        }
                        return response.json();
                    })
                    .then(function (aData) {
                        oModel.setProperty("/products", aData);
                        oModel.setProperty("/productCount", aData.length);
                        oTable.setBusy(false);
                    })
                    .catch(function (oError) {
                        oTable.setBusy(false);
                        MessageBox.error("Failed to load products: " + oError.message);
                    });
            },

            /* ============================================= */
            /* Search / Filter                               */
            /* ============================================= */

            onSearch: function (oEvent) {
                var sQuery = oEvent.getParameter("newValue");
                var aFilters = [];

                if (sQuery && sQuery.length > 0) {
                    aFilters.push(
                        new Filter("ProductName", FilterOperator.Contains, sQuery)
                    );
                }

                var oTable = this.byId("productsTable");
                var oBinding = oTable.getBinding("rows");
                oBinding.filter(aFilters, "Application");
            },

            /* ============================================= */
            /* CREATE                                        */
            /* ============================================= */

            onOpenCreateDialog: function () {
                this._resetCreateDialogValidation();
                this.byId("createProductDialog").open();
            },

            onCreateInputChange: function (oEvent) {
                // Clear error state as user types
                oEvent.getSource().setValueState(ValueState.None);
                oEvent.getSource().setValueStateText("");
            },

            onCancelCreate: function () {
                this._closeAndResetCreateDialog();
            },

            onSaveProduct: function () {
                var oNameInput = this.byId("inputProductName");
                var oPriceInput = this.byId("inputUnitPrice");
                var oStockInput = this.byId("inputUnitsInStock");

                var sProductName = oNameInput.getValue().trim();
                var sUnitPrice = oPriceInput.getValue().trim();
                var sUnitsInStock = oStockInput.getValue().trim();

                // Validation with ValueState
                var bValid = true;

                if (!sProductName) {
                    oNameInput.setValueState(ValueState.Error);
                    oNameInput.setValueStateText("Product Name is required");
                    bValid = false;
                }
                if (!sUnitPrice || isNaN(parseFloat(sUnitPrice)) || parseFloat(sUnitPrice) < 0) {
                    oPriceInput.setValueState(ValueState.Error);
                    oPriceInput.setValueStateText("Enter a valid price");
                    bValid = false;
                }
                if (!sUnitsInStock || isNaN(parseInt(sUnitsInStock, 10)) || parseInt(sUnitsInStock, 10) < 0) {
                    oStockInput.setValueState(ValueState.Error);
                    oStockInput.setValueStateText("Enter a valid stock quantity");
                    bValid = false;
                }

                if (!bValid) {
                    return;
                }

                var oEntry = {
                    ProductName: sProductName,
                    UnitPrice: parseFloat(sUnitPrice),
                    UnitsInStock: parseInt(sUnitsInStock, 10)
                };

                var that = this;

                fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(oEntry)
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("HTTP " + response.status);
                        }
                        return response.json();
                    })
                    .then(function () {
                        MessageToast.show("Product created successfully.");
                        that._closeAndResetCreateDialog();
                        that._loadProducts();
                    })
                    .catch(function (oError) {
                        MessageBox.error("Failed to create product: " + oError.message);
                    });
            },

            _resetCreateDialogValidation: function () {
                var aIds = ["inputProductName", "inputUnitPrice", "inputUnitsInStock"];
                for (var i = 0; i < aIds.length; i++) {
                    this.byId(aIds[i]).setValueState(ValueState.None);
                    this.byId(aIds[i]).setValueStateText("");
                }
            },

            _closeAndResetCreateDialog: function () {
                this.byId("createProductDialog").close();
                this.byId("inputProductName").setValue("");
                this.byId("inputUnitPrice").setValue("");
                this.byId("inputUnitsInStock").setValue("");
                this._resetCreateDialogValidation();
            },

            /* ============================================= */
            /* UPDATE                                        */
            /* ============================================= */

            onEditProduct: function (oEvent) {
                // For sap.ui.table.RowAction, get the row context
                var oRow = oEvent.getParameter("row");
                var oContext = oRow ? oRow.getBindingContext() : oEvent.getSource().getBindingContext();
                var oProduct = oContext.getObject();

                // Store the product id for the update call
                this._iEditProductId = oProduct.id;

                // Pre-fill the edit dialog
                this.byId("editProductName").setValue(oProduct.ProductName);
                this.byId("editUnitPrice").setValue(String(oProduct.UnitPrice));
                this.byId("editUnitsInStock").setValue(String(oProduct.UnitsInStock));
                this._resetEditDialogValidation();

                this.byId("editProductDialog").open();
            },

            onEditInputChange: function (oEvent) {
                oEvent.getSource().setValueState(ValueState.None);
                oEvent.getSource().setValueStateText("");
            },

            onCancelEdit: function () {
                this.byId("editProductDialog").close();
            },

            onUpdateProduct: function () {
                var oNameInput = this.byId("editProductName");
                var oPriceInput = this.byId("editUnitPrice");
                var oStockInput = this.byId("editUnitsInStock");

                var sProductName = oNameInput.getValue().trim();
                var sUnitPrice = oPriceInput.getValue().trim();
                var sUnitsInStock = oStockInput.getValue().trim();

                // Validation with ValueState
                var bValid = true;

                if (!sProductName) {
                    oNameInput.setValueState(ValueState.Error);
                    oNameInput.setValueStateText("Product Name is required");
                    bValid = false;
                }
                if (!sUnitPrice || isNaN(parseFloat(sUnitPrice)) || parseFloat(sUnitPrice) < 0) {
                    oPriceInput.setValueState(ValueState.Error);
                    oPriceInput.setValueStateText("Enter a valid price");
                    bValid = false;
                }
                if (!sUnitsInStock || isNaN(parseInt(sUnitsInStock, 10)) || parseInt(sUnitsInStock, 10) < 0) {
                    oStockInput.setValueState(ValueState.Error);
                    oStockInput.setValueStateText("Enter a valid stock quantity");
                    bValid = false;
                }

                if (!bValid) {
                    return;
                }

                var oEntry = {
                    ProductName: sProductName,
                    UnitPrice: parseFloat(sUnitPrice),
                    UnitsInStock: parseInt(sUnitsInStock, 10)
                };

                var that = this;

                fetch(API_URL + "/" + this._iEditProductId, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(oEntry)
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("HTTP " + response.status);
                        }
                        return response.json();
                    })
                    .then(function () {
                        MessageToast.show("Product updated successfully.");
                        that.byId("editProductDialog").close();
                        that._loadProducts();
                    })
                    .catch(function (oError) {
                        MessageBox.error("Failed to update product: " + oError.message);
                    });
            },

            _resetEditDialogValidation: function () {
                var aIds = ["editProductName", "editUnitPrice", "editUnitsInStock"];
                for (var i = 0; i < aIds.length; i++) {
                    this.byId(aIds[i]).setValueState(ValueState.None);
                    this.byId(aIds[i]).setValueStateText("");
                }
            },

            /* ============================================= */
            /* DELETE                                        */
            /* ============================================= */

            onDeleteProduct: function (oEvent) {
                // For sap.ui.table.RowAction, get the row context
                var oRow = oEvent.getParameter("row");
                var oContext = oRow ? oRow.getBindingContext() : oEvent.getSource().getBindingContext();
                var oProduct = oContext.getObject();
                var that = this;

                MessageBox.confirm(
                    "Are you sure you want to delete \"" + oProduct.ProductName + "\"?",
                    {
                        title: "Confirm Delete",
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                that._deleteProduct(oProduct.id);
                            }
                        }
                    }
                );
            },

            _deleteProduct: function (iProductId) {
                var that = this;

                fetch(API_URL + "/" + iProductId, {
                    method: "DELETE"
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("HTTP " + response.status);
                        }
                        MessageToast.show("Product deleted successfully.");
                        that._loadProducts();
                    })
                    .catch(function (oError) {
                        MessageBox.error("Failed to delete product: " + oError.message);
                    });
            }
        });
    });
