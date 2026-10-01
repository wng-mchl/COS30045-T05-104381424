// Containers: #scatter-chart, #donut-chart, #bar-chart, #line-chart
// Data (in ./data): Ex5_TV_energy.csv, Ex5_TV_energy_Allsizes_byScreenType.csv,
//                   Ex5_TV_energy_55inchtv_byScreenType.csv, Ex5_ARE_Spot_Prices.csv

const tooltip = d3.select("body").append("div").attr("class", "tooltip");

// ---------- Scatter plot: energy consumption vs star rating ----------
function drawScatter(data) {
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 55, left: 55 };

  const svg = d3.select("#scatter-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Scales: map data values to pixel positions
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.energy_consumpt)])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.star2)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .text("Energy consumption (kWh/year)");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height - margin.bottom) / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .text("Star rating");

  // One circle per TV
  svg.append("g")
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.energy_consumpt))
    .attr("cy", d => y(d.star2))
    .attr("r", 4)
    .attr("class", "dot")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.brand}</strong><br>
               ${d.screen_tech}, ${d.screensize}"<br>
               ${d3.format(".0f")(d.energy_consumpt)} kWh/year<br>
               ${d.star2} stars`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 12}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}

// ---------- Donut chart: energy consumption by screen technology (all sizes) ----------
function drawDonut(data) {
  // data: [{ tech: "LCD", energy: 306.5 }, { tech: "LED", ... }, { tech: "OLED", ... }]
  const width = 600;
  const height = 400;
  const radius = 150; // leaves room underneath for the legend
  const innerRadius = radius * 0.55; // hole size; set to 0 for a plain pie

  const svg = d3.select("#donut-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // Centre the group so arcs are drawn around (0, 0)
  const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2 - 15})`);

  // Colour scale: one colour per screen technology (shades of blue)
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.tech))
    .range(["#14306b", "#3a6fd8", "#8fb4f0"]);

  // Pie generator: turns each row into start/end angles sized by its energy value
  const pie = d3.pie()
    .value(d => d.energy)
    .sort(null); // keep the CSV order instead of sorting by size

  // Arc generator: turns those angles into an SVG path shape
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius);

  // One <path> per slice; pie(data) gives each slice its angles in d
  g.selectAll("path")
    .data(pie(data))
    .join("path")
    .attr("class", "slice")
    .attr("d", arc)
    .attr("fill", d => color(d.data.tech));

  // Tooltip on hover (reuses the shared tooltip div from the top of the file)
  g.selectAll(".slice")
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.data.tech}</strong><br>
               ${d3.format(".0f")(d.data.energy)} kWh/year`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 12}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Value label on each slice, placed at the slice's centre (the "centroid")
  g.selectAll(".slice-label")
    .data(pie(data))
    .join("text")
    .attr("class", "slice-label")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em") // nudges text down so it's vertically centred
    .attr("fill", d => d3.lab(color(d.data.tech)).l > 60 ? "#14306b" : "#ffffff") // dark text on light slices
    .text(d => d3.format(".0f")(d.data.energy));

  // Centre of the donut
  g.append("text")
    .attr("class", "centre-text")
    .attr("text-anchor", "middle")
    .attr("dy", "-0.2em")
    .text("Average");

  g.append("text")
    .attr("class", "centre-sub")
    .attr("text-anchor", "middle")
    .attr("dy", "1.2em")
    .text("kWh per year");

  // Legend: a coloured square + name for each technology, centred along the bottom
  const legend = svg.append("g")
    .attr("transform", `translate(${width / 2 - (data.length * 90) / 2}, ${height - 25})`);

  const legendItem = legend.selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d, i) => `translate(${i * 90}, 0)`);

  legendItem.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("rx", 3)
    .attr("fill", d => color(d.tech));

  legendItem.append("text")
    .attr("class", "legend-text")
    .attr("x", 20)
    .attr("y", 12)
    .text(d => d.tech);
}

// ---------- Bar chart: energy consumption by screen technology (55 inch TVs only) ----------
function drawBar(data) {
  // data: [{ tech: "LCD", energy: 326.0 }, { tech: "LED", ... }, { tech: "OLED", ... }]
  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 55, left: 55 };

  const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // x: one band per screen technology; y: energy value
  const x = d3.scaleBand()
    .domain(data.map(d => d.tech))
    .range([margin.left, width - margin.right])
    .padding(0.3); // gap between bars

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.energy)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .text("Screen technology");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height - margin.bottom) / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .text("Average energy (kWh/year)");

  // One <rect> per technology. SVG rects are drawn from their top-left corner,
  // so y is the top of the bar and height is how far down it reaches the axis.
  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.tech))
    .attr("y", d => y(d.energy))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.energy))
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.tech}</strong><br>
               ${d3.format(".0f")(d.energy)} kWh/year`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY - 12}px`);
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  // Value label above each bar
  svg.append("g")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.tech) + x.bandwidth() / 2)
    .attr("y", d => y(d.energy) - 6)
    .attr("text-anchor", "middle")
    .text(d => d3.format(".0f")(d.energy));
}

// ---------- Line chart: spot power prices 1998-2024, one line per state + the average ----------
function drawLine(data) {
  // data: one row per year, e.g. { Year: 1998, "Queensland ($ per megawatt hour)": 60, ... }
  // Snowy is left out because it only has data for 1998-2007.
  const seriesInfo = [
    { key: "Average Price (notTas-Snowy)",           label: "Average", name: "Average (excl. Tas & Snowy)", color: "#14306b", width: 3.5 },
    { key: "Queensland ($ per megawatt hour)",       label: "QLD", name: "Queensland",      color: "#d97706", width: 1.75 },
    { key: "New South Wales ($ per megawatt hour)",  label: "NSW", name: "New South Wales", color: "#0d9488", width: 1.75 },
    { key: "Victoria ($ per megawatt hour)",         label: "VIC", name: "Victoria",        color: "#7c3aed", width: 1.75 },
    { key: "South Australia ($ per megawatt hour)",  label: "SA",  name: "South Australia", color: "#dc2626", width: 1.75 },
    { key: "Tasmania ($ per megawatt hour)",         label: "TAS", name: "Tasmania",        color: "#16a34a", width: 1.75 }
  ];

  // Reshape: one row per year -> one series per line, each holding its own {year, price} points.
  // Blank cells (e.g. Tasmania before 2005) come through as null, so we drop them.
  const series = seriesInfo.map(info => ({
    ...info,
    values: data
      .filter(d => d[info.key] !== null)
      .map(d => ({ year: d.Year, price: d[info.key] }))
  }));

  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 85, left: 55 };

  const svg = d3.select("#line-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // x: year, y: price (the y domain is the biggest price across ALL lines)
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(series, s => d3.max(s.values, v => v.price))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Axes (tickFormat "d" stops years showing as "1,998")
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickValues(d3.range(1998, 2025, 2)).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 38)
    .attr("text-anchor", "middle")
    .text("Year");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height - margin.bottom) / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .text("Spot price ($ per MWh)");

  // Line generator: turns an array of points into one SVG path "d" string
  const line = d3.line()
    .x(v => x(v.year))
    .y(v => y(v.price));

  // One group per series, holding its line and its dots
  const lines = svg.append("g")
    .selectAll("g")
    .data(series)
    .join("g");

  lines.append("path")
    .attr("class", "line")
    .attr("d", s => line(s.values))
    .attr("stroke", s => s.color)
    .attr("stroke-width", s => s.width);

  // Dots on each data point, with the tooltip. The dot's parent series is `s`,
  // so we pass s.values into the inner join and keep s via the closure.
  lines.each(function (s) {
    d3.select(this)
      .selectAll("circle")
      .data(s.values)
      .join("circle")
      .attr("class", "line-dot")
      .attr("cx", v => x(v.year))
      .attr("cy", v => y(v.price))
      .attr("r", 3)
      .attr("fill", s.color)
      .on("mouseover", (event, v) => {
        tooltip
          .style("opacity", 1)
          .html(`<strong>${s.name}</strong><br>
                 ${v.year}: $${v.price}/MWh`);
      })
      .on("mousemove", event => {
        tooltip
          .style("left", `${event.pageX + 12}px`)
          .style("top", `${event.pageY - 12}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  });

  // Legend along the bottom: coloured line swatch + short label
  const itemWidth = 80;
  const legend = svg.append("g")
    .attr("transform", `translate(${width / 2 - (series.length * itemWidth) / 2}, ${height - 22})`);

  const legendItem = legend.selectAll("g")
    .data(series)
    .join("g")
    .attr("transform", (s, i) => `translate(${i * itemWidth}, 0)`);

  legendItem.append("rect")
    .attr("width", 16)
    .attr("height", 4)
    .attr("y", 4)
    .attr("rx", 2)
    .attr("fill", s => s.color);

  legendItem.append("text")
    .attr("class", "legend-text")
    .attr("x", 22)
    .attr("y", 12)
    .text(s => s.label);
}

// ---------- Load data ----------
d3.csv("data/Ex5_TV_energy.csv", d => ({
  brand: d.brand,
  screen_tech: d.screen_tech,
  screensize: +d.screensize,
  energy_consumpt: +d.energy_consumpt, // CSV values are strings, so convert to numbers
  star2: +d.star2
})).then(data => {
  drawScatter(data);
});

d3.csv("data/Ex5_TV_energy_Allsizes_byScreenType.csv", d => ({
  tech: d.Screen_Tech,
  energy: +d["Mean(Labelled energy consumption (kWh/year))"]
})).then(data => {
  drawDonut(data);
});

d3.csv("data/Ex5_TV_energy_55inchtv_byScreenType.csv", d => ({
  tech: d.Screen_Tech,
  energy: +d["Mean(Labelled energy consumption (kWh/year))"]
})).then(data => {
  drawBar(data);
});

// autoType turns numeric strings into numbers and blank cells into null
d3.csv("data/Ex5_ARE_Spot_Prices.csv", d3.autoType).then(data => {
  drawLine(data);
});
