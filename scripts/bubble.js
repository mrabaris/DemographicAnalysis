function BubbleChart(year)
{
  margin = {"left":60, "right": 70, "top":10, "bottom":30};
  var bubbles = null;
  var nodes = [];
  var window_width = window.innerWidth;
  var height = 400;
  var width = 1400;//window_width - 400;
  var width = width - margin.left - margin.right;
  var height = height - margin.top - margin.bottom;
  var state_array = d3.values(states_data[year]);
  state_array.pop();

  var max_per = d3.max(state_array, function(d) {return d.Value;})

  var x_scale = d3.scaleLinear()
                 .domain([0, max_per * 1.1])
                 .range([margin.left, width - margin.right])
                 .nice();
  xScale = x_scale;
  var xAxis = d3.axisBottom(xScale);

  d3.select("#dist-plot").attr("width", width).attr("height", height);

  d3.select("#dist-plot").append("svg").attr("width", width).attr("height", height).attr("id","bubble-chart");

  var svg = d3.select("#bubble-chart");

  //d3.selectAll("#xAxis").attr("transform", "translate(" + 0 + "," + (height - margin.bottom) + ")").transition().duration(1000).call(xAxis)

  svg.append("g").attr("id", "xAxis").classed("axis", true).attr("id", "xAxis").attr("transform", "translate(" + 0 + "," + (height - margin.bottom) + ")");

  d3.selectAll("#xAxis").transition().duration(1000).call(xAxis);

  svg.select("axis").selectAll("text").style("fill", "#fff");

  var state_tip = d3.tip()
                 .attr("class", "d3-tip")
                 .offset([-8, 0])
                 .html(function(d) {
                  var value = (+d.val).toFixed(2) + '%';
                  var pop = NumberWithCommas(d.pop);
                  var str = '<div class="state-tooltip-title">' +
                  d.Geo + '</div>'
                  + '<span class=state-label-P>Percentage: </span>'
                  + '<span class=state-value-P>' + value + '</span><br/>'
                  + '<span class=state-label-P>Matching Population: </span>'
                  + '<span class=state-value-P>' + pop + '</span>';
                  return str;
                  });

  var forceStrength = 0.03;
  var svg = document.getElementById("#bubble-chart");
  var midHeight = (height - margin.top + margin.bottom)/2;

  //svg.call(state_tip);

  function Charge(d)
  {
    return -Math.pow(d.radius, 2) * forceStrength;
  }

  // Returns the value of d.x
  // "nodeYearPos" in his code
  function Pos_X(d)
  {
    return xScale(d.value);
  }


  var simulation = d3.forceSimulation()
                     .velocityDecay(0.2)
                     .force('x', d3.forceX().strength(forceStrength).x(Pos_X))
                     .force('y', d3.forceY().strength(forceStrength).y(midHeight))
                     .force("charge", d3.forceManyBody().strength(Charge))
                     .on("tick", ticked);

  simulation.stop();

  function createNodes()
  {
    var maxVal = d3.max(state_array, function(d) {var temp = (+d["Value"]/100) * (+d["Total"]); return temp;});
    var radiusScale = d3.scalePow()
                        .exponent(0.75)
                        .range([10, 40])
                        .domain([0, maxVal]);

    var myNodes = state_array.map(function(d) {
      var rad = (+d["Value"]/100) * (+d["Total"]);
      return{
        id: d["Geo"],
        radius: radiusScale(rad),
        pop: rad,
        value: +d["Value"],
        x: Math.random() * 300,
        y: Math.random() * 300
      };
    });

    myNodes.sort(function(a,b) {return b.radius - a.radius});

    return myNodes;
  }

  // Supposed to run the simulation to get the values for the forces
  // Though it fails in returning the correct values for 'x' and
  // does not work if you try to use 'xScale' with 'Pos_X' to scale the
  // correct x position
  function MoveBubbles()
  {
    simulation.force('x', d3.forceX().strength(forceStrength).x(Pos_X));
    simulation.alpha(1).restart();
  }


  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart() {
    // convert raw data into nodes data
    var nodes = createNodes();

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select("#bubble-chart");

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
                 .data(nodes, function (d, i) {return d.id;});

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append("circle")
                          .classed("bubble", true)
                          .attr("id", function(d) {return d.id;})
                          .attr("pop", function(d) {return d.pop;})
                          .attr("val", function(d) {return d.value;})
                          .attr('stroke', "#000")
                          .attr('stroke-width', 2)
                          .attr('r', 0)
                          .attr('fill', function(d) {return color(d.value);});
//                          .on("mouseover", state_tip.show)
//                          .on("mouseout", state_tip.hide);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
           .duration(2000)
           .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    MoveBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked()
   {
      bubbles.attr('cx', function (d) {return d.x; })
             .attr('cy', function (d) {return d.y; });
   }

  //var state_ids = Object.keys(states_data[year]);



  chart();
}

function UpdateChart(year)
{

}
