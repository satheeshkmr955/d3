const margin = { t: 40, r: 20, b: 50, l: 100 };
const svgWidth = 560;
const svgHeight = 400;
const gWidth = svgWidth - margin.l - margin.r;
const gHeight = svgHeight - margin.b - margin.t;

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const g = svg
  .append("g")
  .attr("width", gWidth)
  .attr("height", gHeight)
  .attr("transform", `translate(${margin.l}, ${margin.t})`);

const x = d3.scaleTime().range([0, gWidth]);
const y = d3.scaleLinear().range([gHeight, 0]);

const xAxisGroup = g
  .append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${gHeight})`);
const yAxisGroup = g.append("g").attr("class", "y-axis");

const line = d3
  .line()
  .x(d => x(new Date(d.date)))
  .y(d => y(d.distance));

const path = g.append("path");

const dotLine = g
  .append("g")
  .attr("class", "lines")
  .style("opacity", 0);

const xDotLine = dotLine
  .append("line")
  .attr("stroke", "#aaa")
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", 4);
const yDotLine = dotLine
  .append("line")
  .attr("stroke", "#aaa")
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", 4);

const update = data => {
  data = data.filter(obj => obj.activity == activity);
  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  x.domain(d3.extent(data, d => new Date(d.date)));
  y.domain([0, d3.max(data, d => d.distance)]);

  path
    .data([data])
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("d", line);

  const circles = g.selectAll("circle").data(data);

  circles.exit().remove();

  circles.attr("cx", d => x(new Date(d.date))).attr("cy", d => y(d.distance));

  circles
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("cx", d => x(new Date(d.date)))
    .attr("cy", d => y(d.distance))
    .attr("fill", "#ccc");

  g.selectAll("circle")
    .on("mouseover", (d, i, n) => {
      d3.select(n[i])
        .transition()
        .duration(100)
        .attr("r", 8)
        .attr("fill", "#fff");

      xDotLine
        .attr("x1", x(new Date(d.date)))
        .attr("x2", x(new Date(d.date)))
        .attr("y1", gHeight)
        .attr("y2", y(d.distance));
      yDotLine
        .attr("x1", 0)
        .attr("x2", x(new Date(d.date)))
        .attr("y1", y(d.distance))
        .attr("y2", y(d.distance));

      dotLine.style("opacity", 1);
    })
    .on("mouseout", (d, i, n) => {
      d3.select(n[i])
        .transition()
        .duration(100)
        .attr("r", 4)
        .attr("fill", "#fff");

      dotLine.style("opacity", 0);
    });

  const xAxis = d3
    .axisBottom(x)
    .ticks(5)
    .tickFormat(d3.timeFormat("%b %d"));
  const yAxis = d3
    .axisLeft(y)
    .ticks(5)
    .tickFormat(d => d + " m");

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  xAxisGroup
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");
};

let data = [];

db.collection("activities").onSnapshot(res => {
  res.docChanges().map(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case "added":
        data.push(doc);
        break;
      case "modified":
        const i = data.findIndex(obj => obj.id === doc.id);
        data[i] = doc;
        break;
      case "removed":
        data = data.filter(obj => obj.id !== doc.id);
        break;
      default:
        break;
    }
  });

  console.log(data);

  update(data);
});
