import React, { Component } from 'react';
import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import 'd3-transition';
import './App.css';

const checkPath = (start, end) => {
  console.log(start.length, end.length);
  if (start.length < end.length) {
    const newStart = start;
    end.forEach((point, i) => {
        if (!start[i]) {
          newStart.unshift(start[0]);
        }
    });

    return { start: newStart, end };
  }

  if (start.length > end.length) {
    const endStart = end;
    start.forEach((point, i) => {
        if (!end[i]) {
          endStart.unshift(end[0]);
        }
    });

    return { start, end: endStart };
  }

  return { start, end };
};

class App extends Component {
  componentDidMount() {
    const width = 960;
    const height = 500;

    const svg = select("#svg")
    .attr("width", width)
    .attr("height", height);

    Promise.all([
      fetch('./piter_poly.geojson', { method: 'GET' }).then(r => r.json()),
      fetch('./newyork_poly.geojson', { method: 'GET' }).then(r => r.json())
    ]).then(([start, end]) => {
      this.setState({
        start,
        end
      });

      const centroid = geoCentroid(start);

      const projection0 = geoMercator()
        .center(centroid)
        .scale(300000)
        .translate([width / 2, height / 2])
        .precision(0);

      const projection1 = geoMercator()
        .center(centroid)
        .scale(500000)
        .translate([width / 2, height / 2])
        .precision(0);

      const coordinstes = [];
      const pathes = [];

      const geopath = geoPath().projection(projection0);

      start.features.forEach((polygon, i) => {
        const path = svg.append('path').attr("d", geopath);
        const feature0 = polygon.geometry;
        const feature1 = end.features[i].geometry;
        const startEnd = checkPath(feature0.coordinates[0], feature1.coordinates[0]);
        console.log(startEnd);
        const coordinates0 = startEnd.start.map(projection0);
        const coordinates1 = startEnd.end.map(projection1);

        console.log(feature1.coordinates);

        const d0 = "M" + coordinates0.join("L") + "Z";
        const d1 = "M" + coordinates1.join("L") + "Z";

        coordinstes.push({ d0, d1 });

        path.attr("d", d0);

        pathes.push(path);
      });

      const loop = () => {
        pathes.forEach((path, i) => {
          path.transition()
            .duration(5000)
            .attr("d", coordinstes[i].d1)
            .transition()
            .delay(2000)
            .duration(5000)
            .attr("d", coordinstes[i].d0)
            .delay(2000)
            .on("end", () => {
              loop();
            })
        });
      };

      select("#change").on("click", function() {
        loop();
    });
  });
  };

  render() {
    return (
      <div>
        <button id="change">Start</button>
        <svg id="svg"></svg>
      </div>
    );
  }
}

export default App;
