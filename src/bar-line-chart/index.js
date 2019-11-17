const svgWidth = 600;
const svgHeight = 600;

const svg = d3
  .selectAll("#charts")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const m = { t: 20, r: 20, b: 100, l: 100 };
const gWidth = svgWidth - m.l - m.r;
const gHeight = svgHeight - m.t - m.b;

const g = svg
  .append("g")
  .attr("width", gWidth)
  .attr("height", gHeight)
  .attr("transform", `translate(${m.l},${m.t})`);

const xAxisG = g.append("g").attr("transform", `translate(0, ${gHeight})`);
const yAxisG = g.append("g");

const y = d3.scaleLinear().range([gHeight, 0]);
const x = d3
  .scaleBand()
  .range([0, 500])
  .paddingInner(0.2)
  .paddingOuter(0.2);

const xAxis = d3.axisBottom(x);
const yAxis = d3.axisLeft(y);

xAxisG.selectAll("text").style("font-size", 14);
yAxisG.selectAll("text").style("font-size", 14);

const t = d3.transition().duration(1500);

const update = data => {
  y.domain([0, d3.max(data, d => d.orders)]);
  x.domain(data.map(i => i.name));

  const rects = g.selectAll("rect").data(data);

  rects.exit().remove();

  // rects
  //   .attr("width", x.bandwidth)
  //   .attr("fill", "orange")
  //   .attr("x", d => x(d.name));

  rects
    .enter()
    .append("rect")
    .attr("height", 0)
    .attr("fill", "orange")
    .attr("x", d => x(d.name))
    .attr("y", d => gHeight)
    .merge(rects)
    .transition(t)
    .attrTween("width", widthTween)
    .attr("y", d => y(d.orders))
    .attr("height", d => gHeight - y(d.orders));

  xAxisG.call(xAxis);
  yAxisG.call(yAxis);
};

let data = [];
db.collection("dishes").onSnapshot(res => {
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

  update(data);
});

const widthTween = d => {
  const i = d3.interpolate(0, x.bandwidth());
  return t => {
    return i(t);
  };
};
