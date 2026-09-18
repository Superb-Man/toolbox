/*jslint browser: true*/
/*global $, initLRParserPage, createLALRBuilder, genAutomatonLR1*/

$(document).ready(function () {
    'use strict';
    initLRParserPage(createLALRBuilder, genAutomatonLR1);
});
