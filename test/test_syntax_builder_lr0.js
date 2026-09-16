/*jslint node: true */
/*global describe, it */
var assert = require('assert'),
    syntax = require('./../js/syntax');

function snapshot(start) {
    var map = {},
        queue = [start],
        front = 0,
        node,
        symbols,
        keys,
        snap = {},
        sub,
        edges,
        i,
        j;
    while (front < queue.length) {
        node = queue[front];
        front += 1;
        if (map.hasOwnProperty(node.key)) {
            continue;
        }
        map[node.key] = node;
        symbols = Object.keys(node.edges);
        for (i = 0; i < symbols.length; i += 1) {
            queue.push(node.edges[symbols[i]]);
        }
    }
    keys = Object.keys(map);
    for (i = 0; i < keys.length; i += 1) {
        node = map[keys[i]];
        edges = {};
        sub = Object.keys(node.edges);
        for (j = 0; j < sub.length; j += 1) {
            edges[sub[j]] = node.edges[sub[j]].key;
        }
        snap[node.key] = {
            num: node.num,
            kernel: node.kernel,
            nonkernel: node.nonkernel,
            reduces: node.reduces,
            accept: Boolean(node.accept),
            edges: edges
        };
    }
    return JSON.stringify(snap, null, 2);
}

describe('Syntax', function () {
    describe('#LR0 Builder', function () {
        it('expandAll equals constructLR0Automaton', function () {
            var grammar = syntax.parseGrammar(
                    "E -> E + T | T\n" +
                    "T -> T * F | F\n" +
                    "F -> ( E ) | id\n"
                ),
                builder = syntax.createLR0Builder(grammar),
                full = syntax.constructLR0Automaton(grammar);
            assert.strictEqual(snapshot(builder.expandAll()), snapshot(full));
        });

        it('step-by-step expansion reaches the same states', function () {
            var grammar = syntax.parseGrammar(
                    "E -> E + T | T\n" +
                    "T -> T * F | F\n" +
                    "F -> ( E ) | id\n"
                ),
                builder = syntax.createLR0Builder(grammar),
                full = syntax.constructLR0Automaton(grammar),
                queue = [builder.start],
                visited = {},
                front = 0,
                symbols,
                next,
                i;
            visited[builder.start.key] = true;
            while (front < queue.length) {
                symbols = builder.pending(queue[front]);
                for (i = 0; i < symbols.length; i += 1) {
                    next = builder.expand(queue[front], symbols[i]);
                    if (!visited.hasOwnProperty(next.key)) {
                        visited[next.key] = true;
                        queue.push(next);
                    }
                }
                front += 1;
            }
            assert.strictEqual(snapshot(builder.start), snapshot(full));
        });
    });
});
