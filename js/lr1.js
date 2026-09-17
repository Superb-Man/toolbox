/*jslint browser: true*/
/*global $, initLRParserPage, createLR1Builder, genAutomatonLR1*/

$(document).ready(function () {
    'use strict';
    initLRParserPage(createLR1Builder, genAutomatonLR1);
});
