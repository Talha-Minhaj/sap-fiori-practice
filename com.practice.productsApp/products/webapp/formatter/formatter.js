sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Returns stock status text based on UnitsInStock value.
         * @param {number} iUnitsInStock - The units in stock
         * @returns {string} Status text
         */
        stockStatusText: function (iUnitsInStock) {
            if (iUnitsInStock === null || iUnitsInStock === undefined) {
                return "Unknown";
            }
            if (iUnitsInStock === 0) {
                return "Out of Stock";
            }
            if (iUnitsInStock < 10) {
                return "Low Stock";
            }
            return "In Stock";
        },

        /**
         * Returns stock status state (color) based on UnitsInStock value.
         * @param {number} iUnitsInStock - The units in stock
         * @returns {string} sap.ui.core.ValueState
         */
        stockStatusState: function (iUnitsInStock) {
            if (iUnitsInStock === null || iUnitsInStock === undefined) {
                return "None";
            }
            if (iUnitsInStock === 0) {
                return "Error";
            }
            if (iUnitsInStock < 10) {
                return "Warning";
            }
            return "Success";
        },

        /**
         * Formats a price number as a USD currency string e.g. "$19.00".
         * @param {number} fPrice - The price value
         * @returns {string} Formatted currency string
         */
        formatPrice: function (fPrice) {
            if (fPrice === null || fPrice === undefined) {
                return "";
            }
            var oFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                currencyCode: false,
                customCurrencies: { "USD": { symbol: "$", decimals: 2 } }
            });
            return oFormat.format(fPrice, "USD");
        }
    };
});
