import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

const data = [17, 13, 3, 18, 15, 13, 17, 13];
const colors = [
  "#e9d5ff",
  "#d8b4fe",
  "#c084fc",
  "#a855f7",
  "#9333ea",
  "#7e22ce",
  "#6b21a8",
  "#581c87"
];

const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angle: number
) => {
  const rad = (angle - 90) * Math.PI / 180;

  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) => {

  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);

  return `
    M ${cx} ${cy}
    L ${start.x} ${start.y}
    A ${r} ${r} 0 0 0 ${end.x} ${end.y}
    Z
  `;
};

export default function RadialChart() {

  const maxValue = Math.max(...data);
  const size = 300;
  const center = size / 2;
  const angleStep = 360 / data.length;

  return (
    <View style={{ alignItems: "center", marginTop: 40 }}>
      <Svg width={size} height={size}>

        {data.map((value, index) => {

          const radius = 60 + (value / maxValue) * 80;

          const startAngle = index * angleStep;
          const endAngle = startAngle + angleStep - 3;

          return (
            <Path
              key={index}
              d={describeArc(center, center, radius, startAngle, endAngle)}
              fill={colors[index]}
            />
          );
        })}

      </Svg>
    </View>
  );
}