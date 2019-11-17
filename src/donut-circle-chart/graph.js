const dims = { h: 300, w: 300, r: 150 };
const cent = { x: dims.w / 2 + 5, y: dims.h / 2 + 5 };

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.w + 150)
  .attr("height", dims.h + 150);

const graph = svg
  .append("g")
  .attr("transform", `translate(${cent.x}, ${cent.y})`);

const pie = d3
  .pie()
  .sort(null)
  .value(d => d.cost);

const arcPath = d3
  .arc()
  .outerRadius(dims.r)
  .innerRadius(dims.r / 2);

const colour = d3.scaleOrdinal(d3["schemeSet3"]);

const legendGroup = svg
  .append("g")
  .attr("transform", `translate(${dims.w + 40}, 10)`);

const legend = d3
  .legendColor()
  .shape("circle")
  .shapePadding(10)
  .scale(colour);

const tip = d3
  .tip()
  .attr("class", "tip card")
  .html(d => {
    let content = `<div class="name">${d.data.name}</div>`;
    content += `<div class="cost">${d.data.cost}</div>`;
    content += `<div class="delete">Click To Delete</div>`;
    return content;
  });

graph.call(tip);

const update = data => {
  colour.domain(data.map(d => d.name));

  legendGroup.call(legend);
  legendGroup.selectAll("text").attr("fill", "white");

  const paths = graph.selectAll("path").data(pie(data));
  paths
    .exit()
    .transition()
    .duration(750)
    .attrTween("d", arcTweenExit)
    .remove();
  paths
    .attr("d", arcPath)
    .transition()
    .duration(750)
    .attrTween("d", arcTweenUpdate);
  paths
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("stroke", "#fff")
    .attr("stroke-width", 3)
    .attr("fill", d => colour(d.data.name))
    .each(function(d) {
      this._current = d;
    })
    .transition()
    .duration(750)
    .attrTween("d", arcTweenEnter);

  graph
    .selectAll("path")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .on("click", handleClick);

  console.log(paths);
};

let data = [];

db.collection("expenses").onSnapshot(res => {
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

const arcTweenEnter = d => {
  const i = d3.interpolate(d.endAngle, d.startAngle);
  return t => {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

const arcTweenExit = d => {
  const i = d3.interpolate(d.startAngle, d.endAngle);
  return t => {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

function arcTweenUpdate(d) {
  let i = d3.interpolate(this._current, d);
  this._current = i(1);
  return function(t) {
    return arcPath(i(t));
  };
}

const handleMouseOut = (d, i, n) => {
  tip.hide();
  d3.select(n[i])
    .transition("changeColor")
    .duration(300)
    .attr("fill", colour(d.data.name));
};

const handleMouseOver = (d, i, n) => {
  tip.show(d, n[i]);
  d3.select(n[i])
    .transition("changeColor")
    .duration(300)
    .attr("fill", "white");
};

const handleClick = d => {
  const id = d.data.id;
  db.collection("expenses")
    .doc(id)
    .delete();
};
