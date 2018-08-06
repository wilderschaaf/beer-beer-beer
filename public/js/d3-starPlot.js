d3.starPlot = function() {
  var width = 200,
      margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      labelMargin = 20,
      includeGuidelines = true,
      includeLabels = true,
      accessors = [],
      accessors2 = [],
      labels = [],
      title = nop,
      secondset = true,

      g,
      datum,
      radius = width / 2,
      origin = [radius, radius],
      radii = accessors.length,
      radians = 2 * Math.PI / radii,
      scale = d3.scale.linear()
        .domain([0, 100])
        .range([0, radius])

  function chart(selection) {

    datum = selection.data();
    console.log(datum[0])
    g = selection
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    if (includeGuidelines) {
      drawGuidelines();
    }
    if (includeLabels) {
      drawLabels();
    }

    drawChart();
  }

  function drawGuidelines() {
    var r = 0;
    accessors.forEach(function(d, i) {
      var l, x, y;

      l = radius;
      x = l * Math.cos(r);
      y = l * Math.sin(r);
      g.append('line')
        .attr('class', 'star-axis')
        .attr('x1', origin[0])
        .attr('y1', origin[1])
        .attr('x2', origin[0] + x)
        .attr('y2', origin[1] + y)

      r += radians;
    })
    r = 0;
    if(secondset){
      accessors2.forEach(function(d, i) {
        var l, x, y;
        l = radius;
        x = l * Math.cos(r);
        y = l * Math.sin(r);
        g.append('line')
          .attr('class', 'star-axis')
          .attr('x1', origin[0])
          .attr('y1', origin[1])
          .attr('x2', origin[0] + x)
          .attr('y2', origin[1] + y)

        r += radians;
      })
    }
  }

  function drawLabels() {
    var r = 0;
    accessors.forEach(function(d, i) {
      var l, x, y;

      l = radius;
      x = (l + labelMargin) * Math.cos(r);
      y = (l + labelMargin) * Math.sin(r);
      g.append('text')
        .attr('class', 'star-label')
        .attr('x', origin[0] + x)
        .attr('y', origin[1] + y)
        .text(labels[i])
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')

      r += radians;
    })
  }

  function drawChart() {
    g.append('circle')
      .attr('class', 'star-origin')
      .attr('cx', origin[0])
      .attr('cy', origin[1])
      .attr('r', 2)

    var path = d3.svg.line.radial()

    var pathData = [];

    
    var r = Math.PI / 2;
    accessors.forEach(function(d) {
      pathData.push([
        scale(d(datum[0])),
        r
      ])
      r += radians;
    });

    g.append('path')
      .attr('class', 'star-path')
      .attr('transform', 'translate(' + origin[0] + ',' + origin[1] + ')')
      .attr('d', path(pathData) + 'Z');

    g.append('text')
      .attr('class', 'star-title')
      .attr('x', origin[0])
      .attr('y', -(margin.top / 2))
      .text(title(datum[0]))
      .style('text-anchor', 'middle')

    if(true){
      path = d3.svg.line.radial()

      pathData = [];

      console.log("here i am")
      r = Math.PI / 2;
      accessors2.forEach(function(d) {
        pathData.push([
          scale(d(datum[1])),
          r
        ])
        r += radians;
      });

      g.append('path')
        .attr('class', 'star-path')
        .attr('transform', 'translate(' + origin[0] + ',' + origin[1] + ')')
        .attr('d', path(pathData) + 'Z');
    } 
  }

  function nop() {
    return;
  }

  chart.accessors = function(_) {
    if (!arguments.length) return accessors;
    accessors = _;
    radii = accessors.length;
    radians = 2 * Math.PI / radii;
    return chart;
  };

  chart.accessors2 = function(_) {
    if (!arguments.length) return accessors2;
    accessors2 = _;
    console.log(accessors2)
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    radius = width / 2;
    origin = [radius, radius];
    scale.range([0, radius])
    return chart;
  };

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    origin = [radius, radius];
    return chart;
  };

  chart.labelMargin = function(_) {
    if (!arguments.length) return labelMargin;
    labelMargin = _;
    return chart;
  };

  chart.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return chart;
  };

  chart.secondset = function(_) {
    if (!arguments.length) return secondset;
    secondset = _;
    console.log(secondset)
    return chart;
  };

  chart.labels = function(_) {
    if (!arguments.length) return labels;
    labels = _;
    return chart;
  };

  chart.includeGuidelines = function(_) {
    if (!arguments.length) return includeGuidelines;
    includeGuidelines = _;
    return chart;
  };

  chart.includeLabels = function(_) {
    if (!arguments.length) return includeLabels;
    includeLabels = _;
    return chart;
  };

  return chart;
}