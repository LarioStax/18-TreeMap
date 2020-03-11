const DATA = {
	games: {
		TITLE: "Video Game Sales",
		DESCRIPTION: "Top 100 Most Sold Video Games By Platform",
		URL: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json",
	},
	movies: {
		TITLE: "Movie Sales",
		DESCRIPTION: "Top 100 Highest Grossing Movies By Genre",
		URL: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json",
	},
	kickstarter: {
		TITLE: "Kickstarter Pledges",
		DESCRIPTION: "Top 100 Most Pledged Kickstarter Campaigns By Category",
		URL: "https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json",
	}
};
const COLOR_PALETTE = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', /*'#000075',*/ '#808080', /*'#ffffff', '#000000'*/]

let chosenDataset = DATA.games;
getAndDraw();

document.querySelector("#games").onclick = function() {
	chosenDataset = DATA.games;
	getAndDraw();
};

document.querySelector("#movies").onclick = function() {
	chosenDataset = DATA.movies;
	getAndDraw();
};

document.querySelector("#kickstarter").onclick = function() {
	chosenDataset = DATA.kickstarter;
	getAndDraw();
};


function getAndDraw() {
	d3.json(chosenDataset.URL).then( (data) => drawGraph(data)) 
};


function shuffleArray(arr) { //Fisher-Yates shuffle - go backwards and swap each element with a random one before it!
	let tempArr = [...arr]
	for (let i = tempArr.length-1; i>0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[tempArr[i], tempArr[j]] = [tempArr[j], tempArr[i]];
	};
	return tempArr;
};



function drawGraph(data) {
	document.querySelector("#section").innerHTML = "";
	const WIDTH = 1500;
	const HEIGHT = 550;

	let colors = shuffleArray(COLOR_PALETTE);
	let color = d3.scaleOrdinal(colors);

	let treemap = d3.treemap()
		.size([WIDTH, HEIGHT])
		.padding(2)

	let root = d3.hierarchy(data)
		.sum( (d) => d.value)
		.sort( (a, b) => b.height - a.height || b.value - a.value);

	treemap(root);

	let section = d3.select("section")

	// HEADER
	let header = section
		.append("header")

	header
		.append("h1")
			.attr("id", "title")
			.text(chosenDataset.TITLE)

	header
		.append("h4")
			.attr("id", "description")
			.text(chosenDataset.DESCRIPTION)
	// HEADER END

	let svg = section
		.append("svg")
			.attr("width", WIDTH)
			.attr("height", HEIGHT)
			.style("font-size", "11px")

	let cell = svg
		.selectAll("g")
		.data(root.leaves())
		.enter()
		.append("g")
			.attr("class", "group")
			.attr("transform", (d) => `translate(${d.x0}, ${d.y0})`)

	let tile = cell
		.append("rect")
			.classed("tile", true)
			.attr("width", (d) => d.x1-d.x0)
			.attr("height", (d) => d.y1-d.y0)
			.attr("fill", (d) => color(d.data.category))
			.attr("data-name", (d) => d.data.name)
			.attr("data-category", (d) => d.data.category)
			.attr("data-value", (d) => d.data.value)
			.on("mouseover", handleMouseOver)
			.on("mousemove", handleMouseMove)
			.on("mouseout", handleMouseOut)

	let tileText = cell.append("text") //this whole part is weird! try to do something else?
		.selectAll("tspan")
		.data( (d) => d.data.name.split(/(?=[A-Z][^A-Z])/g)) //umm.. why exactly? copied from google! doesn't even work correctly! UNDERSTAND AND THEN FIX THIS!
		.enter()
		.append("tspan")
			.attr("x", (d) => 5)
			.attr("y", (d, i) => 12+12*i)
			.text(d => d)
			.attr("fill", "#222")
			// .on("mouseover", handleMouseOver) //doesn't work correctly due to data being only names
			// .on("mousemove", handleMouseMove)
			// .on("mouseout", handleMouseOut)

	// TOOLTIP
		let tooltip = d3.select("body")
			.append("div")
				.style("opacity", 0)
				.attr("id", "tooltip")
				.style("position", "absolute")
				.style("background-color", `#555`)
				.style("color", "#eee")
				.style("border", "2px solid #444")
				.style("font-weight", "bold")
				.style("padding", "10px")
				.style("text-align", "center")

	function handleMouseOver(el) {
		tooltip
				.transition()
				.style("opacity", 0.9)
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY - 10 + "px")
				.attr("data-value", `${el.data.value}`)
				.html(
					`Name: ${el.data.name}</br>
					Category: ${el.data.category}</br>
					Value: ${el.data.value}`
				)
		d3.select(this)
				.style("opacity", 0.2)
	}

	function handleMouseOut(el) {
		tooltip
				.transition()
				.style("opacity", 0)
		tooltip
				.style("left", "-1000px") //solves a bug (bug? or feature? :-$ ) if you go to an element under where tooltip used to be, it wouldn't open a new one
				.style("top", "-1000px") //thinks it's still in the (now invisible) tooltip, so the mouseover doesn't activate, this moves it out of the way
		d3.select(this)
				.style("opacity", 1)
	}

	function handleMouseMove(el) {
		tooltip
				.style("left", d3.event.pageX + 10 + "px")
				.style("top", d3.event.pageY - 10 + "px")
	}
	//END TOOLTIP

	//LEGEND
	const LEGEND_WIDTH = 800;
	const LEGEND_HEIGHT = 150;
	const LEGEND_H_SPACING = 160;
	const LEGEND_V_SPACING = 10;
	const LEGEND_RECT = 20;
	const ELEMENTS_PER_ROW = Math.floor(LEGEND_WIDTH/LEGEND_H_SPACING)
	let categories = root.leaves().map( (el) => el.data.category)
	categories = [...new Set(categories)]
	// console.log(categories)

	let legend = section
		.append("svg")
			.attr("id", "legend")
			.attr("width", LEGEND_WIDTH)
			.attr("height", LEGEND_HEIGHT)

	let legendElement = legend
		.append("g")
			.attr("transform", `translate(50, ${LEGEND_V_SPACING})`)
		.selectAll("g")
		.data(categories)
		.enter()
		.append("g")
			.attr("transform", function (d, i) { return `translate(
				${(i%ELEMENTS_PER_ROW)*LEGEND_H_SPACING}, 
				${Math.floor(i/ELEMENTS_PER_ROW)*LEGEND_RECT + Math.floor(i/ELEMENTS_PER_ROW)*LEGEND_V_SPACING})`
			})

	legendElement
		.append("rect")
			.classed("legend-item", true)
			.attr("width", LEGEND_RECT)
			.attr("height", LEGEND_RECT)
			.attr("fill", (d) => color(d))

	legendElement
		.append("text")
			.classed("legend-text", true)
			.attr("x", LEGEND_RECT+5)
			.attr("y", LEGEND_RECT-5)
			.text( (d) => d)

	//END LEGEND
}
