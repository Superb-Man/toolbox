/*jslint browser: true*/
/*global grammarTerminals, window, parseGrammar, d3, $*/

function initLRParserPage(createBuilder, renderAutomaton) {
    'use strict';

    var builder = null,
        grammar = null,
        newlyAdded = null,
        input;

    function b64EncodeUnicode(str) {
        return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            match = match.prototype; // For jslint.
            return String.fromCharCode('0x' + p1);
        }));
    }

    function b64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(window.atob(str.replace(' ', '+')), function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    function getParameterByName(name) {
        var url = window.location.href,
            regex,
            results;
        name = name.replace(/[\[\]]/g, "\\$&");
        regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        results = regex.exec(url);
        if (!results) {
            return null;
        }
        if (!results[2]) {
            return '';
        }
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function showParsingTable(grammar, automaton) {
        var i, j, k,
            keys = Object.keys(grammar),
            symbol,
            symbols = grammarTerminals(grammar).filter(function (terminal) { return terminal !== '$'; }),
            queue = [automaton],
            front = 0,
            node,
            nums,
            nodes = {'0': automaton},
            html = '',
            td,
            count,
            conflicts = 0;
        while (front < queue.length) {
            node = queue[front];
            front += 1;
            symbol = Object.keys(node.edges);
            for (j = 0; j < symbol.length; j += 1) {
                if (symbol[j] !== '$') {
                    if (keys.indexOf(symbol[j]) < 0 && symbols.indexOf(symbol[j]) < 0) {
                        symbols.push(symbol[j]);
                    }
                }
                if (!nodes.hasOwnProperty(node.edges[symbol[j]].num)) {
                    nodes[node.edges[symbol[j]].num] = node.edges[symbol[j]];
                    queue.push(node.edges[symbol[j]]);
                }
            }
        }
        symbols.sort();
        symbols.push('$');

        html += '<table class="table">';
        html += '<thead>';
        html += '<tr>';
        html += '<th style="vertical-align: middle" class="text-center" rowspan="2">STATE</th>';
        html += '<th class="text-center" colspan="' + symbols.length + '">ACTION</th>';
        html += '<th class="text-center" colspan="' + keys.length + '">GOTO</th>';
        html += '</tr>';
        html += '<tr>';
        for (i = 0; i < symbols.length; i += 1) {
            html += '<th class="text-center">' + symbols[i] + '</th>';
        }
        for (i = 0; i < keys.length; i += 1) {
            html += '<th class="text-center">' + keys[i] + '</th>';
        }
        html += '</tr>';
        html += '</thead>';
        html += '<tbody>';
        nums = Object.keys(nodes);
        for (i = 0; i < nums.length; i += 1) {
            html += '<tr>';
            html += '<td class="text-center">' + nums[i] + '</td>';
            node = nodes[nums[i]];
            for (j = 0; j < symbols.length; j += 1) {
                td = '';
                count = 0;
                if (symbols[j] === '$' && node.accept) {
                    count += 1;
                    td += 'acc';
                }
                if (node.edges.hasOwnProperty(symbols[j])) {
                    if (count > 0) {
                        td += '<br>';
                    }
                    count += 1;
                    td += 's' + node.edges[symbols[j]].num;
                }
                if (node.reduces.hasOwnProperty(symbols[j])) {
                    for (k = 0; k < node.reduces[symbols[j]].length; k += 1) {
                        if (count > 0) {
                            td += '<br>';
                        }
                        count += 1;
                        td += 'r( ' + node.reduces[symbols[j]][k].head + ' -> ' + node.reduces[symbols[j]][k].body.join(' ') + ' )';
                    }
                }
                if (count > 1) {
                    conflicts += 1;
                    html += '<td class="text-center text-danger">' + td + '</td>';
                } else {
                    html += '<td class="text-center">' + td + '</td>';
                }
            }
            for (j = 0; j < keys.length; j += 1) {
                if (node.edges.hasOwnProperty(keys[j])) {
                    html += '<td class="text-center">' + node.edges[keys[j]].num + '</td>';
                } else {
                    html += '<td></td>';
                }
            }
            html += '</tr>';
        }
        html += '</tbody>';
        html += '</table>';
        $('#parsing_table').html('<p class="' + (conflicts ? 'text-danger' : 'text-success') + '">' +
            conflicts + ' conflicting ACTION cells in the constructed states. ' +
            'Conflicts do not prevent diagram construction.</p>' + html);
    }

    function redraw() {
        redrawGraph();
        renderStepPanel();
    }

    function redrawGraph() {
        d3.select('#svg').select('g').selectAll('*').remove();
        $('svg').attr('width', $('svg').parent().width());
        renderAutomaton('svg', builder.start, newlyAdded);
        showParsingTable(grammar, builder.start);
    }

    function collectStates(start) {
        var queue = [start],
            visited = {},
            states = [],
            front = 0,
            node,
            keys,
            i;
        visited[start.key] = true;
        while (front < queue.length) {
            node = queue[front];
            front += 1;
            states.push(node);
            keys = Object.keys(node.edges);
            for (i = 0; i < keys.length; i += 1) {
                if (!visited.hasOwnProperty(node.edges[keys[i]].key)) {
                    visited[node.edges[keys[i]].key] = true;
                    queue.push(node.edges[keys[i]]);
                }
            }
        }
        return states;
    }

    function findStateByNum(num) {
        var states = collectStates(builder.start), i;
        for (i = 0; i < states.length; i += 1) {
            if (states[i].num === num) {
                return states[i];
            }
        }
        return builder.start;
    }

    function renderStepPanel() {
        var states = collectStates(builder.start),
            html = '',
            i,
            node,
            syms,
            j;
        html += '<h5>Step-through construction</h5>';
        html += '<p>States built so far. Click a symbol to expand that transition.</p>';
        for (i = 0; i < states.length; i += 1) {
            node = states[i];
            syms = builder.pending(node);
            html += '<div class="step-state">';
            html += '<span class="step-state-name">I' + node.num + (node.accept ? ' (accept)' : '') + '</span>';
            if (syms.length > 0) {
                html += '<span class="step-symbols">';
                for (j = 0; j < syms.length; j += 1) {
                    html += '<button class="btn btn-xs step-symbol' +
                        (node.edges.hasOwnProperty(syms[j]) ? ' visited' : '') +
                        '" data-num="' + node.num + '" data-symbol="' + syms[j] + '">' + syms[j] + '</button>';
                }
                html += '</span>';
            } else {
                html += '<span class="step-symbols text-muted">no more transitions</span>';
            }
            html += '</div>';
        }
        $('#step_panel').html(html);
        $('#step_panel .step-symbol').off('click').on('click', function () {
            var num = parseInt($(this).attr('data-num'), 10),
                symbol = $(this).attr('data-symbol'),
                state = findStateByNum(num);
            newlyAdded = {from: state.num, to: builder.expand(state, symbol).num};
            redraw();
        });
        $('#button_expand_all').off('click').on('click', expandAll);
    }

    function expandAll() {
        var queue = [builder.start],
            visited = {},
            front = 0,
            node,
            syms,
            next,
            i;
        visited[builder.start.key] = true;
        while (front < queue.length) {
            node = queue[front];
            front += 1;
            syms = builder.pending(node);
            for (i = 0; i < syms.length; i += 1) {
                next = builder.expand(node, syms[i]);
                if (!visited.hasOwnProperty(next.key)) {
                    visited[next.key] = true;
                    queue.push(next);
                }
            }
        }
        newlyAdded = null;
        redraw();
    }

    function construct(stepwise) {
        var prefix = window.location.href.split('?')[0] + '?grammar=',
            input = b64EncodeUnicode($('#input_grammar').val());
        try {
            grammar = parseGrammar($('#input_grammar').val());
            builder = createBuilder(grammar);
        } catch (error) {
            $('#p_error').text(error.message);
            $('#alert_error').show();
            return;
        }
        if (grammar === null || builder === null) {
            $('#p_error').text('Enter at least one production using -> or →.');
            $('#alert_error').show();
            return;
        }
        $('#input_url').val(prefix + input);
        $('#alert_error').hide();
        newlyAdded = null;
        if (stepwise) {
            redraw();
        } else {
            expandAll();
        }
    }

    $('#button_construct').click(function () {
        construct(false);
    });
    $('#button_step').click(function () {
        construct(true);
    });

    input = getParameterByName('grammar');
    if (input) {
        input = b64DecodeUnicode(input);
        $('#input_grammar').val(input);
        $('#button_construct').click();
    }

}
