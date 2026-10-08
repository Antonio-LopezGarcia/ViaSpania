import {describe,expect,it} from 'vitest';
import {DEFAULT_CONTOUR_DISPLAY_STYLE,styleContourLines} from './contourDisplayStyle';

const lines=[10,20,30,40,50].map(level=>({level,coordinates:[[0,0],[1,1]] as [number,number][]}));

describe('styleContourLines',()=>{
  it('styles every fifth contour as a major line and preserves its geometry',()=>{
    const styled=styleContourLines(lines,DEFAULT_CONTOUR_DISPLAY_STYLE,10);
    expect(styled.map(line=>line.width)).toEqual([1,1,1,1,2.2]);
    expect(styled.every(line=>line.color==='#111111'&&line.halo==='#ffffff')).toBe(true);
    expect(styled[0].coordinates).toBe(lines[0].coordinates);
  });

  it('uses inferred spacing when no interval is supplied and keeps disabled major lines thin',()=>{
    const styled=styleContourLines(lines,{...DEFAULT_CONTOUR_DISPLAY_STYLE,majorInterval:0});
    expect(styled.map(line=>line.width)).toEqual([1,1,1,1,1]);
  });

  it('colors by elevation and selects a contrasting halo',()=>{
    const styled=styleContourLines(lines,{...DEFAULT_CONTOUR_DISPLAY_STYLE,mode:'elevation'});
    expect(new Set(styled.map(line=>line.color)).size).toBe(5);
    expect(styled.every(line=>line.halo==='#ffffff')).toBe(true);
  });
});
