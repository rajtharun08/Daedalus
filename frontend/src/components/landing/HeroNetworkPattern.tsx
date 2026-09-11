import React from 'react';

/**
 * HeroNetworkPattern
 * Faithfully recreates the cybernetic constellation/plexus network pattern from the user reference image:
 * - Upper-left magenta/violet geometric polygon mesh with ambient purple radial glow
 * - Upper-right cyan/sky-blue geometric polygon mesh with ambient electric cyan radial glow
 * - Top-center gradient bridge connecting the two networks
 * - Floating glowing vertex nodes, halo rings, and twinkling star particles
 * - Open center ensuring complete readability of hero content
 * - Strictly pointer-events-none so all interactive elements function without interruption
 */
export const HeroNetworkPattern: React.FC = () => {
  return (
    <div
      className="absolute -top-16 left-1/2 -translate-x-1/2 w-screen max-w-[100vw] pointer-events-none select-none overflow-hidden h-[760px] sm:h-[840px] lg:h-[940px] z-0"
      aria-hidden="true"
    >
      {/* 1. Deep Space Atmospheric Nebula Glows */}
      {/* Top-Left Purple Nebula */}
      <div className="absolute top-0 left-0 w-[550px] sm:w-[700px] h-[550px] sm:h-[650px] bg-gradient-to-br from-fuchsia-600/25 via-purple-600/18 to-transparent rounded-full blur-[110px] -translate-x-1/4 -translate-y-1/4 pointer-events-none" />

      {/* Top-Right Cyan/Azure Nebula */}
      <div className="absolute top-0 right-0 w-[550px] sm:w-[700px] h-[550px] sm:h-[650px] bg-gradient-to-bl from-cyan-400/25 via-blue-600/18 to-transparent rounded-full blur-[110px] translate-x-1/4 -translate-y-1/4 pointer-events-none" />

      {/* Subtle Central Cosmic Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-space-950/60 rounded-full blur-[90px] pointer-events-none" />

      {/* 2. Scalable High-Precision SVG Constellation Mesh */}
      <svg
        className="w-full h-full object-cover opacity-95 transition-opacity duration-700"
        viewBox="0 0 1440 760"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          {/* Edge Gradients */}
          <linearGradient id="purpleEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="cyanEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="bridgeEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.65" />
          </linearGradient>

          {/* Node Glow Filters */}
          <radialGradient id="purpleNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="1" />
            <stop offset="40%" stopColor="#d946ef" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="cyanNodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#00f0ff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>

          {/* Subtle Facet Fill for Polygon Dimension */}
          <linearGradient id="purpleFacet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="cyanFacet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>

          {/* Vertical Fade Mask ensuring smooth fade into lower page */}
          <linearGradient id="verticalMaskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          <mask id="meshFadeMask">
            <rect x="0" y="0" width="1440" height="760" fill="url(#verticalMaskGrad)" />
          </mask>
        </defs>

        <g mask="url(#meshFadeMask)">
          {/* ========================================================= */}
          {/* 1. LEFT MESH (PURPLE / MAGENTA POLYGON FACETS & EDGES)     */}
          {/* ========================================================= */}

          {/* Subtle Translucent Geometric Facets */}
          <polygon points="30,40 90,20 70,95" fill="url(#purpleFacet)" />
          <polygon points="90,20 130,45 70,95" fill="url(#purpleFacet)" />
          <polygon points="130,45 195,25 185,105 120,125" fill="url(#purpleFacet)" />
          <polygon points="195,25 265,55 250,135 185,105" fill="url(#purpleFacet)" />
          <polygon points="265,55 330,40 315,115 250,135" fill="url(#purpleFacet)" />
          <polygon points="40,190 95,180 135,235 65,275" fill="url(#purpleFacet)" />
          <polygon points="95,180 185,210 175,295 135,235" fill="url(#purpleFacet)" />
          <polygon points="20,320 65,275 115,330 35,415" fill="url(#purpleFacet)" />
          <polygon points="35,415 115,330 175,295 90,390" fill="url(#purpleFacet)" />
          <polygon points="35,415 90,390 115,475 60,500" fill="url(#purpleFacet)" />

          {/* Top Outer Ridge Edges */}
          <g stroke="url(#purpleEdge)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <line x1="30" y1="40" x2="90" y2="20" />
            <line x1="90" y1="20" x2="130" y2="45" />
            <line x1="130" y1="45" x2="195" y2="25" />
            <line x1="195" y1="25" x2="265" y2="55" />
            <line x1="265" y1="55" x2="330" y2="40" />
            <line x1="330" y1="40" x2="385" y2="80" />

            {/* Upper Polygon Lattice */}
            <line x1="30" y1="40" x2="70" y2="95" />
            <line x1="90" y1="20" x2="70" y2="95" />
            <line x1="70" y1="95" x2="120" y2="125" />
            <line x1="130" y1="45" x2="70" y2="95" />
            <line x1="130" y1="45" x2="120" y2="125" />
            <line x1="130" y1="45" x2="185" y2="105" />
            <line x1="195" y1="25" x2="185" y2="105" />
            <line x1="185" y1="105" x2="120" y2="125" />
            <line x1="185" y1="105" x2="250" y2="135" />
            <line x1="265" y1="55" x2="185" y2="105" />
            <line x1="265" y1="55" x2="250" y2="135" />
            <line x1="265" y1="55" x2="315" y2="115" />
            <line x1="330" y1="40" x2="315" y2="115" />
            <line x1="315" y1="115" x2="250" y2="135" />
            <line x1="315" y1="115" x2="385" y2="80" />

            {/* Mid-Left Connecting Lattice */}
            <line x1="70" y1="95" x2="40" y2="190" />
            <line x1="70" y1="95" x2="95" y2="180" />
            <line x1="120" y1="125" x2="95" y2="180" />
            <line x1="120" y1="125" x2="185" y2="105" />
            <line x1="185" y1="105" x2="185" y2="210" />
            <line x1="250" y1="135" x2="185" y2="210" />
            <line x1="250" y1="135" x2="235" y2="190" />
            <line x1="315" y1="115" x2="235" y2="190" />

            {/* Mid-Tier Web */}
            <line x1="40" y1="190" x2="95" y2="180" />
            <line x1="95" y1="180" x2="135" y2="235" />
            <line x1="40" y1="190" x2="65" y2="275" />
            <line x1="95" y1="180" x2="65" y2="275" />
            <line x1="65" y1="275" x2="135" y2="235" />
            <line x1="135" y1="235" x2="185" y2="210" />
            <line x1="185" y1="210" x2="235" y2="190" />
            <line x1="135" y1="235" x2="175" y2="295" />
            <line x1="185" y1="210" x2="175" y2="295" />

            {/* Lower-Tier Descending Facets */}
            <line x1="65" y1="275" x2="20" y2="320" />
            <line x1="65" y1="275" x2="115" y2="330" />
            <line x1="135" y1="235" x2="115" y2="330" />
            <line x1="115" y1="330" x2="175" y2="295" />
            <line x1="20" y1="320" x2="35" y2="415" />
            <line x1="20" y1="320" x2="115" y2="330" />
            <line x1="115" y1="330" x2="90" y2="390" />
            <line x1="35" y1="415" x2="90" y2="390" />
            <line x1="175" y1="295" x2="90" y2="390" />

            {/* Lower Tail Flank */}
            <line x1="35" y1="415" x2="60" y2="500" />
            <line x1="90" y1="390" x2="115" y2="475" />
            <line x1="60" y1="500" x2="115" y2="475" />
            <line x1="35" y1="415" x2="115" y2="475" />
            <line x1="60" y1="500" x2="15" y2="540" />
            <line x1="15" y1="540" x2="50" y2="610" />
            <line x1="60" y1="500" x2="85" y2="570" />
            <line x1="115" y1="475" x2="85" y2="570" />
            <line x1="50" y1="610" x2="85" y2="570" />
          </g>

          {/* ========================================================= */}
          {/* 2. TOP-CENTER OVERHEAD BRIDGE (PURPLE TO CYAN TRANSITION)  */}
          {/* ========================================================= */}
          <g stroke="url(#bridgeEdge)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
            <line x1="385" y1="80" x2="450" y2="45" />
            <line x1="385" y1="80" x2="440" y2="110" />
            <line x1="450" y1="45" x2="440" y2="110" />
            <line x1="450" y1="45" x2="515" y2="30" />
            <line x1="440" y1="110" x2="510" y2="95" />
            <line x1="515" y1="30" x2="510" y2="95" />
            <line x1="515" y1="30" x2="580" y2="55" />
            <line x1="510" y1="95" x2="580" y2="55" />
            <line x1="580" y1="55" x2="650" y2="35" />
            <line x1="580" y1="55" x2="640" y2="105" />
            <line x1="650" y1="35" x2="640" y2="105" />
            <line x1="650" y1="35" x2="720" y2="25" />
            <line x1="640" y1="105" x2="715" y2="80" />
            <line x1="720" y1="25" x2="715" y2="80" />
            <line x1="720" y1="25" x2="790" y2="45" />
            <line x1="715" y1="80" x2="790" y2="45" />
            <line x1="790" y1="45" x2="865" y2="25" />
            <line x1="790" y1="45" x2="860" y2="90" />
            <line x1="865" y1="25" x2="860" y2="90" />
            <line x1="865" y1="25" x2="935" y2="50" />
            <line x1="860" y1="90" x2="935" y2="50" />
            <line x1="935" y1="50" x2="990" y2="85" />
            <line x1="935" y1="50" x2="1020" y2="35" />
            <line x1="990" y1="85" x2="1020" y2="35" />
            <line x1="990" y1="85" x2="1015" y2="110" />
          </g>

          {/* ========================================================= */}
          {/* 3. RIGHT MESH (CYAN / AZURE POLYGON FACETS & EDGES)       */}
          {/* ========================================================= */}

          {/* Subtle Translucent Facets on Right */}
          <polygon points="1020,35 1090,20 1075,95 1015,110" fill="url(#cyanFacet)" />
          <polygon points="1090,20 1150,40 1140,120 1075,95" fill="url(#cyanFacet)" />
          <polygon points="1150,40 1215,15 1205,85 1140,120" fill="url(#cyanFacet)" />
          <polygon points="1215,15 1275,45 1260,130 1205,85" fill="url(#cyanFacet)" />
          <polygon points="1275,45 1345,25 1330,95 1260,130" fill="url(#cyanFacet)" />
          <polygon points="1345,25 1410,35 1395,115 1330,95" fill="url(#cyanFacet)" />
          <polygon points="1140,120 1205,85 1280,215 1145,195" fill="url(#cyanFacet)" />
          <polygon points="1260,130 1330,95 1355,180 1280,215" fill="url(#cyanFacet)" />
          <polygon points="1330,95 1395,115 1425,170 1355,180" fill="url(#cyanFacet)" />
          <polygon points="1280,215 1355,180 1385,255 1315,275" fill="url(#cyanFacet)" />
          <polygon points="1315,275 1385,255 1405,335 1335,350" fill="url(#cyanFacet)" />
          <polygon points="1335,350 1405,335 1420,420 1365,435" fill="url(#cyanFacet)" />
          <polygon points="1365,435 1420,420 1410,515 1340,545" fill="url(#cyanFacet)" />

          {/* Right Constellation Stroke Network */}
          <g stroke="url(#cyanEdge)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            {/* Top Outer Ridge */}
            <line x1="1020" y1="35" x2="1090" y2="20" />
            <line x1="1090" y1="20" x2="1150" y2="40" />
            <line x1="1150" y1="40" x2="1215" y2="15" />
            <line x1="1215" y1="15" x2="1275" y2="45" />
            <line x1="1275" y1="45" x2="1345" y2="25" />
            <line x1="1345" y1="25" x2="1410" y2="35" />

            {/* Upper Polygon Diamonds */}
            <line x1="1020" y1="35" x2="1015" y2="110" />
            <line x1="1090" y1="20" x2="1075" y2="95" />
            <line x1="1015" y1="110" x2="1075" y2="95" />
            <line x1="1150" y1="40" x2="1140" y2="120" />
            <line x1="1075" y1="95" x2="1140" y2="120" />
            <line x1="1215" y1="15" x2="1205" y2="85" />
            <line x1="1140" y1="120" x2="1205" y2="85" />
            <line x1="1275" y1="45" x2="1260" y2="130" />
            <line x1="1205" y1="85" x2="1260" y2="130" />
            <line x1="1345" y1="25" x2="1330" y2="95" />
            <line x1="1260" y1="130" x2="1330" y2="95" />
            <line x1="1410" y1="35" x2="1395" y2="115" />
            <line x1="1330" y1="95" x2="1395" y2="115" />

            {/* Faceted Mid Lattice */}
            <line x1="1075" y1="95" x2="1085" y2="175" />
            <line x1="1140" y1="120" x2="1085" y2="175" />
            <line x1="1085" y1="175" x2="1145" y2="195" />
            <line x1="1140" y1="120" x2="1145" y2="195" />
            <line x1="1145" y1="195" x2="1215" y2="170" />
            <line x1="1205" y1="85" x2="1215" y2="170" />
            <line x1="1260" y1="130" x2="1215" y2="170" />
            <line x1="1215" y1="170" x2="1280" y2="215" />
            <line x1="1260" y1="130" x2="1280" y2="215" />
            <line x1="1330" y1="95" x2="1355" y2="180" />
            <line x1="1280" y1="215" x2="1355" y2="180" />
            <line x1="1395" y1="115" x2="1425" y2="170" />
            <line x1="1355" y1="180" x2="1425" y2="170" />

            {/* Prominent Geometric Boxes (As seen in reference image) */}
            <line x1="1280" y1="215" x2="1245" y2="290" />
            <line x1="1280" y1="215" x2="1315" y2="275" />
            <line x1="1245" y1="290" x2="1315" y2="275" />
            <line x1="1355" y1="180" x2="1385" y2="255" />
            <line x1="1315" y1="275" x2="1385" y2="255" />
            <line x1="1425" y1="170" x2="1430" y2="245" />
            <line x1="1385" y1="255" x2="1430" y2="245" />

            {/* Lower-Right Descending Strands */}
            <line x1="1245" y1="290" x2="1270" y2="375" />
            <line x1="1315" y1="275" x2="1335" y2="350" />
            <line x1="1270" y1="375" x2="1335" y2="350" />
            <line x1="1385" y1="255" x2="1405" y2="335" />
            <line x1="1335" y1="350" x2="1405" y2="335" />
            <line x1="1430" y1="245" x2="1405" y2="335" />

            <line x1="1270" y1="375" x2="1295" y2="460" />
            <line x1="1335" y1="350" x2="1365" y2="435" />
            <line x1="1295" y1="460" x2="1365" y2="435" />
            <line x1="1405" y1="335" x2="1420" y2="420" />
            <line x1="1365" y1="435" x2="1420" y2="420" />

            <line x1="1295" y1="460" x2="1340" y2="545" />
            <line x1="1365" y1="435" x2="1410" y2="515" />
            <line x1="1340" y1="545" x2="1410" y2="515" />
            <line x1="1340" y1="545" x2="1385" y2="605" />
            <line x1="1410" y1="515" x2="1430" y2="585" />
            <line x1="1385" y1="605" x2="1430" y2="585" />
          </g>

          {/* ========================================================= */}
          {/* 4. GLOWING VERTEX NODES                                   */}
          {/* ========================================================= */}

          {/* Left Purple Vertex Nodes */}
          {[
            [30, 40], [90, 20], [70, 95], [130, 45], [120, 125],
            [195, 25], [185, 105], [265, 55], [250, 135], [330, 40],
            [315, 115], [385, 80], [40, 190], [95, 180], [65, 275],
            [135, 235], [115, 330], [185, 210], [175, 295], [235, 190],
            [20, 320], [35, 415], [90, 390], [60, 500], [115, 475],
            [15, 540], [50, 610], [85, 570],
          ].map(([x, y], idx) => (
            <g key={`pnode-${idx}`}>
              {/* Outer soft halo */}
              <circle cx={x} cy={y} r="5.5" fill="url(#purpleNodeGlow)" opacity="0.8" />
              {/* Core dot */}
              <circle cx={x} cy={y} r="2.2" fill="#ffffff" />
            </g>
          ))}

          {/* Top Bridge Intermediate Nodes */}
          {[
            [450, 45], [440, 110], [515, 30], [510, 95], [580, 55],
            [650, 35], [640, 105], [720, 25], [715, 80], [790, 45],
            [865, 25], [860, 90], [935, 50], [990, 85],
          ].map(([x, y], idx) => (
            <g key={`bnode-${idx}`}>
              <circle cx={x} cy={y} r="4.5" fill={idx < 7 ? '#d946ef' : '#38bdf8'} opacity="0.45" />
              <circle cx={x} cy={y} r="1.8" fill="#ffffff" />
            </g>
          ))}

          {/* Right Cyan Vertex Nodes */}
          {[
            [1020, 35], [1015, 110], [1090, 20], [1075, 95], [1150, 40],
            [1140, 120], [1215, 15], [1205, 85], [1275, 45], [1260, 130],
            [1345, 25], [1330, 95], [1410, 35], [1395, 115], [1085, 175],
            [1145, 195], [1215, 170], [1280, 215], [1355, 180], [1425, 170],
            [1245, 290], [1315, 275], [1385, 255], [1430, 245], [1270, 375],
            [1335, 350], [1405, 335], [1295, 460], [1365, 435], [1420, 420],
            [1340, 545], [1410, 515], [1385, 605], [1430, 585],
          ].map(([x, y], idx) => (
            <g key={`cnode-${idx}`}>
              {/* Outer soft halo */}
              <circle cx={x} cy={y} r="5.5" fill="url(#cyanNodeGlow)" opacity="0.85" />
              {/* Core dot */}
              <circle cx={x} cy={y} r="2.2" fill="#ffffff" />
            </g>
          ))}

          {/* ========================================================= */}
          {/* 5. FLOATING SATELLITE STAR PARTICLES                      */}
          {/* ========================================================= */}
          {/* Purple Field Star Particles */}
          {[
            [45, 80], [100, 150], [160, 70], [220, 110], [75, 230],
            [140, 170], [200, 260], [40, 360], [110, 410], [85, 480],
            [30, 570], [120, 520], [240, 240], [160, 360], [55, 150],
          ].map(([x, y], idx) => (
            <circle
              key={`pstar-${idx}`}
              cx={x}
              cy={y}
              r={idx % 3 === 0 ? 1.5 : 1}
              fill="#f0abfc"
              opacity={0.45 + (idx % 4) * 0.15}
              className="animate-pulse"
              style={{ animationDuration: `${2.5 + (idx % 3)}s`, animationDelay: `${idx * 0.2}s` }}
            />
          ))}

          {/* Cyan Field Star Particles */}
          {[
            [1380, 50], [1310, 140], [1260, 90], [1410, 190], [1340, 230],
            [1270, 270], [1370, 310], [1430, 370], [1320, 410], [1390, 470],
            [1350, 500], [1420, 560], [1230, 230], [1290, 330], [1380, 140],
          ].map(([x, y], idx) => (
            <circle
              key={`cstar-${idx}`}
              cx={x}
              cy={y}
              r={idx % 3 === 0 ? 1.5 : 1}
              fill="#bae6fd"
              opacity={0.45 + (idx % 4) * 0.15}
              className="animate-pulse"
              style={{ animationDuration: `${2.5 + (idx % 3)}s`, animationDelay: `${idx * 0.25}s` }}
            />
          ))}

          {/* Top Bridge Star Particles */}
          {[
            [470, 70], [550, 40], [680, 60], [760, 35], [830, 75], [910, 40],
          ].map(([x, y], idx) => (
            <circle
              key={`bstar-${idx}`}
              cx={x}
              cy={y}
              r="1.2"
              fill="#ffffff"
              opacity="0.55"
              className="animate-pulse"
              style={{ animationDuration: '3s', animationDelay: `${idx * 0.3}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
