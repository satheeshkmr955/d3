const dims = { w: 1100, h: 500 };

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.w + 100)
  .attr("height", dims.h + 100);

const g = svg
  .append("g")
  .append("g")
  .attr("transform", "translate(50, 50)");

const stratify = d3
  .stratify()
  .id(d => d.name)
  .parentId(d => d.parent);

const tree = d3.tree().size([dims.w, dims.h]);

const colour = d3.scaleOrdinal(["#f4511e", "#e91e63", "#e53935", "#9c27b0"]);

const update = data => {
  g.selectAll(".node").remove();
  g.selectAll(".link").remove();

  colour.domain(data.map(obj => obj.department));

  const rootNode = stratify(data);

  const treeData = tree(rootNode);

  const nodes = g.selectAll(".node").data(treeData.descendants());

  const links = g.selectAll(".link").data(treeData.links());

  links
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("class", "link")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .linkVertical()
        .x(d => d.x)
        .y(d => d.y)
    );

  const enterNodes = nodes
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`);

  enterNodes
    .append("rect")
    .attr("height", 50)
    .attr("width", d => d.data.name.length * 20)
    .attr("fill", d => colour(d.data.department))
    .attr("stroke", "#555")
    .attr("stroke-width", 2)
    .attr("transform", d => `translate(${-(d.data.name.length * 10)},-30)`);

  enterNodes
    .append("text")
    .text(d => d.data.name)
    .attr("fill", "white")
    .attr("text-anchor", "middle");
};

let data = [];

db.collection("employees").onSnapshot(res => {
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
