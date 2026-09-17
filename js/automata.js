/*jslint browser: true*/
/*global d3, dagreD3*/

/**
 * @param {string} svgId The id of the svg tag, which should contains a `g` tag.
 * @param {object} start @see regexToNfa().
 * @return {void}
 */
function genAutomataSVG(svgId, start) {
    'use strict';
    var ids = {},
        node,
        next,
        i,
        front = 0,
        queue = [start],
        g = new dagreD3.graphlib.Graph().setGraph({}),
        svg = d3.select(svgId),
        inner = svg.select('g'),
        zoom,
        render = new dagreD3.render();

    zoom = d3.behavior.zoom().on('zoom', function () {
        inner.attr('transform', 'translate(' + d3.event.translate + ')' + 'scale(' + d3.event.scale + ')');
    });
    svg.call(zoom);
    g.setNode(-1, {shape: 'text', label: 'start'});
    while (front < queue.length) {
        node = queue[front];
        ids[node.id] = node;
        if (node === start) {
            g.setEdge(-1, node.id, {label: ''});
        }
        if (node.type === '' || node.type === 'start') {
            node.type = 'normal';
        }
        g.setNode(node.id, {shape: node.type, label: node.id});
        for (i = 0; i < node.edges.length; i += 1) {
            next = node.edges[i][1];
            g.setEdge(node.id, next.id, {label: node.edges[i][0]});
            if (!ids.hasOwnProperty(next.id)) {
                queue.push(next);
            }
        }
        front += 1;
    }

    render.shapes().text = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            rx = Math.min(w / 2, h / 2),
            ry = rx,
            point = {x: w / 2, y: h / 2},
            shapeSvg = parent
                .insert("ellipse", ":first-child")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("rx", rx)
                .attr("ry", ry)
                .attr("fill-opacity", "0")
                .attr("stroke-opacity", "0")
                .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");

        node.intersect = function (point) {
            return dagreD3.intersect.ellipse(node, rx, ry, point);
        };
        return shapeSvg;
    };

    render.shapes().normal = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            rx = Math.min(w / 2, h / 2),
            ry = rx,
            point = {x: w / 2, y: h / 2},
            shapeSvg = parent
                .insert("ellipse", ":first-child")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("rx", rx)
                .attr("ry", ry)
                .attr("fill", "white")
                .attr("fill-opacity", "0")
                .attr("stroke", "black")
                .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");

        node.intersect = function (point) {
            return dagreD3.intersect.ellipse(node, rx, ry, point);
        };
        return shapeSvg;
    };

    render.shapes().accept = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            rx = Math.min(w / 2, h / 2),
            ry = rx,
            point = {x: w / 2, y: h / 2},
            shapeSvg = parent
                .insert("ellipse", ":first-child")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("rx", rx)
                .attr("ry", ry)
                .attr("accept", '')
                .attr("fill", "white")
                .attr("fill-opacity", "0")
                .attr("stroke", "black")
                .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");
        shapeSvg = parent
            .insert("ellipse", ":first-child")
            .attr("cx", point.x)
            .attr("cy", point.y)
            .attr("rx", rx - 2)
            .attr("ry", ry - 2)
            .attr("accept", '')
            .attr("fill", "white")
            .attr("fill-opacity", "0")
            .attr("stroke", "black")
            .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");

        node.intersect = function (point) {
            return dagreD3.intersect.ellipse(node, rx, ry, point);
        };
        return shapeSvg;
    };
    g.graph().rankdir = 'LR';
    render(inner, g);
    var graphWidth = document.getElementById('graph_column').clientWidth;
    svg.attr('width', Math.max(graphWidth, g.graph().width + 40));
    zoom
        .translate([20, 20])
        .event(svg);
    svg.attr('height', Math.max(document.getElementById('graph_column').clientHeight, g.graph().height * 1.5 + 40));
}

function genAutomatonLRItems(svgId, start, highlight) {
    'use strict';
    var ids = {},
        node,
        label,
        keys,
        next,
        cls,
        i,
        front = 0,
        queue = [start],
        g = new dagreD3.graphlib.Graph().setGraph({}),
        svg = d3.select(svgId),
        inner = svg.select('g'),
        zoom,
        render = new dagreD3.render();

    zoom = d3.behavior.zoom().on("zoom", function () {
        inner.attr("transform", "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);

    function prettyPrintItem(item) {
        return item.head + ' -> ' + item.body.join(' ');
    }

    function prettyPrintItems(items) {
        return items.map(prettyPrintItem, items).join('\n');
    }

    inner.selectAll('*').remove(); // clear the inner svg before rendering

    
    while (front < queue.length) {
        node = queue[front];
        ids[node.num] = node;
        label = 'I' + node.num + '\n===\n' + prettyPrintItems(node.kernel) + '\n---\n' + prettyPrintItems(node.nonkernel);
        cls = '';
        if (highlight) {
            if (node.num === highlight.to) {
                cls = 'newly-added';
            } else if (node.num === highlight.from) {
                cls = 'edge-source';
            }
        }
        g.setNode('n' + node.num, {shape: 'rect', label: label, 'class': cls});
        keys = Object.keys(node.edges);
        for (i = 0; i < keys.length; i += 1) {
            next = node.edges[keys[i]];
            g.setEdge('n' + node.num, 'n' + next.num, {
                label: keys[i],
                'class': (highlight && node.num === highlight.from && next.num === highlight.to) ? 'edge-new' : ''
            });
            if (!ids.hasOwnProperty(next.num)) {
                queue.push(next);
            }
        }
        if (node.accept) {
            g.setNode('accept_' + node.num, {shape: 'text', label: 'accept'});
            g.setEdge('n' + node.num, 'accept_' + node.num, {label: '$'});
        }
        front += 1;
    }

    render.shapes().text = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            rx = Math.min(w / 2, h / 2),
            ry = rx,
            point = {x: w / 2, y: h / 2},
            shapeSvg = parent
                .insert("ellipse", ":first-child")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("rx", rx)
                .attr("ry", ry)
                .attr("fill-opacity", "0")
                .attr("stroke-opacity", "0")
                .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");

        node.intersect = function (point) {
            return dagreD3.intersect.ellipse(node, rx, ry, point);
        };
        return shapeSvg;
    };

    g.graph().rankdir = 'LR';
    render(inner, g);

    svg.attr('width', Math.max(+svg.attr('width') || 0, g.graph().width + 20));
    zoom
        .translate([(svg.attr("width") - g.graph().width) / 2, 20])
        .event(svg);
    svg.attr('height', g.graph().height * 1.5 + 40);
}

// LR(0) and SLR(1) use the same item diagram, with different parsing tables.
function genAutomatonLR0(svgId, start, highlight) {
    'use strict';
    genAutomatonLRItems(svgId, start, highlight);
}

function genAutomatonSLR1(svgId, start, highlight) {
    'use strict';
    genAutomatonLRItems(svgId, start, highlight);
}

function genAutomatonLR1(svgId, start, highlight) {
    'use strict';
    var ids = {},
        node,
        label,
        keys,
        next,
        cls,
        i,
        front = 0,
        queue = [start],
        g = new dagreD3.graphlib.Graph().setGraph({}),
        svg = d3.select(svgId),
        inner = svg.select('g'),
        zoom,
        render = new dagreD3.render();

    zoom = d3.behavior.zoom().on("zoom", function () {
        inner.attr("transform", "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);

    function prettyPrintItem(item) {
        return item.head + ' -> ' + item.body.join(' ') + ', ' + item.lookahead.join('/');
    }

    function prettyPrintItems(items) {
        return items.map(prettyPrintItem, items).join('\n');
    }

    inner.selectAll('*').remove(); // clear the inner svg before rendering

    while (front < queue.length) {
        node = queue[front];
        ids[node.num] = node;
        label = 'I' + node.num + '\n===\n' + prettyPrintItems(node.kernel) + '\n---\n' + prettyPrintItems(node.nonkernel);
        cls = '';
        if (highlight) {
            if (node.num === highlight.to) {
                cls = 'newly-added';
            } else if (node.num === highlight.from) {
                cls = 'edge-source';
            }
        }
        g.setNode('n' + node.num, {shape: 'rect', label: label, 'class': cls});
        keys = Object.keys(node.edges);
        for (i = 0; i < keys.length; i += 1) {
            next = node.edges[keys[i]];
            g.setEdge('n' + node.num, 'n' + next.num, {
                label: keys[i],
                'class': (highlight && node.num === highlight.from && next.num === highlight.to) ? 'edge-new' : ''
            });
            if (!ids.hasOwnProperty(next.num)) {
                queue.push(next);
            }
        }
        if (node.accept) {
            g.setNode('accept_' + node.num, {shape: 'text', label: 'accept'});
            g.setEdge('n' + node.num, 'accept_' + node.num, {label: '$'});
        }
        front += 1;
    }

    render.shapes().text = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height,
            rx = Math.min(w / 2, h / 2),
            ry = rx,
            point = {x: w / 2, y: h / 2},
            shapeSvg = parent
                .insert("ellipse", ":first-child")
                .attr("cx", point.x)
                .attr("cy", point.y)
                .attr("rx", rx)
                .attr("ry", ry)
                .attr("fill-opacity", "0")
                .attr("stroke-opacity", "0")
                .attr("transform", "translate(" + (-w / 2) + "," + (-h / 2) + ")");

        node.intersect = function (point) {
            return dagreD3.intersect.ellipse(node, rx, ry, point);
        };
        return shapeSvg;
    };

    g.graph().rankdir = 'LR';
    render(inner, g);
    svg.attr('width', Math.max(+svg.attr('width') || 0, g.graph().width + 20));
    zoom
        .translate([(svg.attr("width") - g.graph().width) / 2, 20])
        .event(svg);
    svg.attr('height', g.graph().height * 1.5 + 40);
}
