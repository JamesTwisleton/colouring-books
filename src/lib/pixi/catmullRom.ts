/**
 * Catmull-Rom spline utilities for smooth brush stroke interpolation.
 *
 * Given 4 control points, computes the cubic Bézier control points for the
 * segment from p1 → p2 (passing through all control points).
 */

export interface Point {
  x: number;
  y: number;
}

export interface BezierSegment {
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
}

/**
 * Converts a Catmull-Rom segment (4 points) into cubic Bézier control points.
 * The resulting curve travels from p1 to p2, tangent-influenced by p0 and p3.
 *
 * @param p0 - Point before the segment start (tangent influence)
 * @param p1 - Segment start
 * @param p2 - Segment end
 * @param p3 - Point after the segment end (tangent influence)
 * @param alpha - Tension (0.5 = centripetal, recommended for drawing)
 */
export function catmullRomToBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  alpha = 0.5
): BezierSegment {
  return {
    start: p1,
    cp1: {
      x: p1.x + (p2.x - p0.x) * alpha * 0.5,
      y: p1.y + (p2.y - p0.y) * alpha * 0.5,
    },
    cp2: {
      x: p2.x - (p3.x - p1.x) * alpha * 0.5,
      y: p2.y - (p3.y - p1.y) * alpha * 0.5,
    },
    end: p2,
  };
}

/**
 * Mirror a point P1 around P0. Used to synthesize a "before first" or
 * "after last" control point when the stroke has fewer than 4 points.
 */
export function mirrorPoint(pivot: Point, source: Point): Point {
  return {
    x: 2 * pivot.x - source.x,
    y: 2 * pivot.y - source.y,
  };
}
