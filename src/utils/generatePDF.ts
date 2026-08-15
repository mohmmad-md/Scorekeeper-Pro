import { Game } from '../types';
import jsPDF from 'jspdf';

/**
 * Generates a professional PDF scorecard using direct PDF drawing (no html2canvas).
 * This is much more reliable than screenshot-based approaches.
 */
export async function generateScorecardPDF(game: Game): Promise<void> {
  const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape A4
  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const usableW = pageW - 2 * margin;
  let y = margin;

  // Colors
  const headerBg = [30, 41, 59]; // slate-800
  const rowBg = [51, 65, 85]; // slate-700
  const white = [255, 255, 255];
  const lightGray = [203, 213, 225];
  const accentBlue = [59, 130, 246];
  const accentGreen = [16, 185, 129];
  const accentRed = [239, 68, 68];
  const accentAmber = [245, 158, 11];

  // Helper: draw text
  const drawText = (text: string, x: number, yy: number, size: number, bold = false, color: number[] = white) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(text, x, yy);
  };

  // Helper: draw rect
  const drawRect = (x: number, yy: number, w: number, h: number, color: number[]) => {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(x, yy, w, h, 'F');
  };

  // Helper: draw line (used for borders)
  const _drawLine = (x1: number, y1: number, x2: number, y2: number, color: number[], width = 0.2) => {
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(width);
    pdf.line(x1, y1, x2, y2);
  };
  void _drawLine; // keep for future use

  // ========== PAGE 1: HEADER + LINE SCORE + SCORECARD GRID ==========

  // Header background
  drawRect(margin, y, usableW, 22, headerBg);
  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, y, usableW, 22, 'S');

  // Title
  drawText('BASEBALL SCORECARD', margin + 5, y + 8, 14, true, accentBlue);
  drawText(`${game.awayTeam.name}  vs  ${game.homeTeam.name}`, margin + 5, y + 15, 9, false, lightGray);

  // Score
  drawText(`${game.awayScore} - ${game.homeScore}`, pageW - margin - 30, y + 12, 16, true, accentAmber);
  if (game.status === 'completed') {
    const winner = game.homeScore > game.awayScore ? game.homeTeam.name : game.awayScore > game.homeScore ? game.awayTeam.name : 'Tie';
    drawText(game.homeScore === game.awayScore ? 'Tie Game' : `${winner} Wins`, pageW - margin - 30, y + 19, 7, true, accentGreen);
  }

  // Date/Location
  drawText(`${game.date}  |  ${game.location || 'TBD'}`, margin + 5, y + 20, 7, false, [148, 163, 184]);

  y += 26;

  // ========== LINE SCORE ==========
  const maxInning = Math.max(game.currentInning, ...game.plays.map(p => p.inning), game.inningsCount);
  const teamColW = 35;
  const inningColW = Math.min(12, (usableW - teamColW - 40) / maxInning);
  const rColW = 10;

  // Header row
  drawRect(margin, y, usableW, 7, headerBg);
  drawText('Team', margin + 2, y + 5, 7, true, lightGray);
  for (let i = 0; i < maxInning; i++) {
    drawText(String(i + 1), margin + teamColW + i * inningColW + inningColW / 2, y + 5, 7, true, lightGray);
  }
  const rStart = margin + teamColW + maxInning * inningColW;
  drawText('R', rStart + rColW / 2, y + 5, 7, true, accentAmber);
  drawText('H', rStart + rColW + rColW / 2, y + 5, 7, true, accentBlue);
  drawText('E', rStart + 2 * rColW + rColW / 2, y + 5, 7, true, accentRed);

  y += 7;

  // Team rows
  const getRunsPerInning = (isHome: boolean) => {
    const half = isHome ? 'bottom' : 'top';
    const runs: number[] = [];
    for (let i = 1; i <= maxInning; i++) {
      const inningPlays = game.plays.filter(p => p.inning === i && p.half === half);
      runs.push(inningPlays.reduce((sum, p) => sum + p.runsScored, 0));
    }
    return runs;
  };

  const totalHits = (isHome: boolean) => {
    const team = isHome ? game.homeTeam : game.awayTeam;
    return team.players.reduce((sum, p) => sum + p.stats.h, 0);
  };

  const totalErrors = (isHome: boolean) => {
    const half = isHome ? 'top' : 'bottom';
    return game.plays.filter(p => p.half === half && p.outcome === 'E').length;
  };

  [
    { team: game.awayTeam, isHome: false, label: game.awayTeam.name },
    { team: game.homeTeam, isHome: true, label: game.homeTeam.name }
  ].forEach(({ isHome, label }, idx) => {
    const bg = idx % 2 === 0 ? rowBg : [40, 50, 70];
    drawRect(margin, y, usableW, 7, bg);
    drawText(label, margin + 2, y + 5, 7, true, white);
    const runs = getRunsPerInning(isHome);
    for (let i = 0; i < maxInning; i++) {
      drawText(runs[i] > 0 ? String(runs[i]) : '-', margin + teamColW + i * inningColW + inningColW / 2, y + 5, 7, false, white);
    }
    const totalR = runs.reduce((s, r) => s + r, 0);
    drawText(String(totalR), rStart + rColW / 2, y + 5, 8, true, accentAmber);
    drawText(String(totalHits(isHome)), rStart + rColW + rColW / 2, y + 5, 7, false, accentBlue);
    drawText(String(totalErrors(isHome)), rStart + 2 * rColW + rColW / 2, y + 5, 7, false, accentRed);
    y += 7;
  });

  y += 4;

  // ========== BATTING STATISTICS ==========
  const renderBattingTable = (teamLabel: string, team: typeof game.homeTeam, startY: number): number => {
    let cy = startY;
    const cols = [
      { label: '#', w: 6 },
      { label: 'Player', w: 30 },
      { label: 'Pos', w: 8 },
      { label: 'AB', w: 7 },
      { label: 'R', w: 7 },
      { label: 'H', w: 7 },
      { label: 'RBI', w: 8 },
      { label: '2B', w: 7 },
      { label: '3B', w: 7 },
      { label: 'HR', w: 7 },
      { label: 'BB', w: 7 },
      { label: 'SO', w: 7 },
      { label: 'SB', w: 7 },
      { label: 'AVG', w: 10 },
      { label: 'OBP', w: 10 },
      { label: 'SLG', w: 10 },
      { label: 'OPS', w: 10 },
    ];
    const totalColsW = cols.reduce((s, c) => s + c.w, 0);
    const offsetX = margin + (usableW - totalColsW) / 2;

    // Team header
    drawRect(offsetX, cy, totalColsW, 6, headerBg);
    drawText(`${teamLabel}: ${team.name}`, offsetX + 2, cy + 4.5, 7, true, accentBlue);
    cy += 6;

    // Column headers
    drawRect(offsetX, cy, totalColsW, 5, [60, 70, 90]);
    let cx = offsetX;
    cols.forEach(col => {
      drawText(col.label, cx + col.w / 2, cy + 3.5, 5, true, lightGray);
      cx += col.w;
    });
    cy += 5;

    // Player rows
    team.players.forEach((p, idx) => {
      const bg = idx % 2 === 0 ? rowBg : [40, 50, 70];
      drawRect(offsetX, cy, totalColsW, 5, bg);
      const ab = p.stats.ab;
      const h = p.stats.h;
      const avg = ab > 0 ? (h / ab).toFixed(3) : '.000';
      const obp = (ab + p.stats.bb) > 0 ? ((h + p.stats.bb) / (ab + p.stats.bb)).toFixed(3) : '.000';
      const slg = ab > 0 ? ((p.stats.h + p.stats.double + 2 * p.stats.triple + 3 * p.stats.hr) / ab).toFixed(3) : '.000';
      const ops = (parseFloat(obp) + parseFloat(slg)).toFixed(3);

      const values = [
        String(idx + 1), p.name, p.position,
        String(p.stats.ab), String(p.stats.r), String(p.stats.h), String(p.stats.rbi),
        String(p.stats.double), String(p.stats.triple), String(p.stats.hr),
        String(p.stats.bb), String(p.stats.so), String(p.stats.sb),
        avg, obp, slg, ops
      ];

      cx = offsetX;
      cols.forEach((col, ci) => {
        drawText(values[ci], cx + col.w / 2, cy + 3.5, 5, false, white);
        cx += col.w;
      });
      cy += 5;

      // Check if we need a new page
      if (cy > pageH - 20) {
        pdf.addPage();
        cy = margin;
      }
    });

    return cy + 4;
  };

  y = renderBattingTable('AWAY', game.awayTeam, y);

  // Check space for home team
  if (y > pageH - 60) {
    pdf.addPage();
    y = margin;
  }

  y = renderBattingTable('HOME', game.homeTeam, y);

  // ========== PITCHING STATS (if space) ==========
  if (y < pageH - 40) {
    const renderPitchingTable = (teamLabel: string, team: typeof game.homeTeam, startY: number): number => {
      let cy = startY;
      const pitchers = team.players.filter(p => p.position === 'P' || p.stats.pitchCount > 0);
      if (pitchers.length === 0) return cy;

      const cols = [
        { label: 'Player', w: 30 },
        { label: 'IP', w: 8 },
        { label: 'H', w: 7 },
        { label: 'R', w: 7 },
        { label: 'ER', w: 8 },
        { label: 'BB', w: 7 },
        { label: 'K', w: 7 },
        { label: 'Pitches', w: 12 },
        { label: 'ERA', w: 10 },
        { label: 'WHIP', w: 10 },
      ];
      const totalColsW = cols.reduce((s, c) => s + c.w, 0);
      const offsetX = margin + (usableW - totalColsW) / 2;

      drawRect(offsetX, cy, totalColsW, 6, headerBg);
      drawText(`Pitching: ${teamLabel}`, offsetX + 2, cy + 4.5, 7, true, accentGreen);
      cy += 6;

      drawRect(offsetX, cy, totalColsW, 5, [60, 70, 90]);
      let cx = offsetX;
      cols.forEach(col => {
        drawText(col.label, cx + col.w / 2, cy + 3.5, 5, true, lightGray);
        cx += col.w;
      });
      cy += 5;

      pitchers.forEach((p, idx) => {
        const bg = idx % 2 === 0 ? rowBg : [40, 50, 70];
        drawRect(offsetX, cy, totalColsW, 5, bg);
        const ip = p.stats.ip || 1;
        const era = ((p.stats.earnedRuns / ip) * 9).toFixed(2);
        const whip = ((p.stats.hitsAllowed + p.stats.bb) / ip).toFixed(2);

        const values = [
          p.name, String(p.stats.ip), String(p.stats.hitsAllowed),
          String(p.stats.r), String(p.stats.earnedRuns), String(p.stats.bb),
          String(p.stats.so), String(p.stats.pitchCount), era, whip
        ];

        cx = offsetX;
        cols.forEach((col, ci) => {
          drawText(values[ci], cx + col.w / 2, cy + 3.5, 5, false, white);
          cx += col.w;
        });
        cy += 5;
      });

      return cy + 4;
    };

    y = renderPitchingTable(game.awayTeam.name, game.awayTeam, y);
    y = renderPitchingTable(game.homeTeam.name, game.homeTeam, y);
  }

  // ========== PLAY-BY-PLAY SUMMARY ==========
  if (game.plays.length > 0 && y < pageH - 30) {
    drawRect(margin, y, usableW, 6, headerBg);
    drawText('PLAY-BY-PLAY SUMMARY', margin + 3, y + 4.5, 7, true, accentBlue);
    y += 7;

    const maxPlays = Math.min(game.plays.length, 30);
    for (let i = 0; i < maxPlays; i++) {
      const play = game.plays[i];
      if (y > pageH - 12) {
        pdf.addPage();
        y = margin;
      }
      const bg = i % 2 === 0 ? rowBg : [40, 50, 70];
      drawRect(margin, y, usableW, 5, bg);
      const inningStr = `${play.half === 'top' ? '▲' : '▼'} ${play.inning}`;
      const outcomeStr = play.outcome || '-';
      const batterStr = play.batterName || play.batterId;
      const runsStr = play.runsScored > 0 ? `+${play.runsScored}R` : '';
      const note = `${inningStr}  |  ${batterStr}  |  ${outcomeStr}  ${play.fieldersInvolved || ''}  ${runsStr}`.trim();
      drawText(note, margin + 2, y + 3.5, 5, false, white);
      y += 5;
    }
  }

  // Footer
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Generated by Scorekeeper Pro — Baseball Scorecard & Statistics Tracker', pageW / 2, pageH - 5, { align: 'center' });

  // Save
  const fileName = `scorecard-${game.awayTeam.name}-vs-${game.homeTeam.name}-${game.date}.pdf`;
  pdf.save(fileName);
}
