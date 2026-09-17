/*jslint browser: true*/
/*global $, initLRParserPage, createLR0Builder, genAutomatonLR0*/

$(document).ready(function () {
    'use strict';
    initLRParserPage(createLR0Builder, genAutomatonLR0);
});
