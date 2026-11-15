// @vitest-environment jsdom
import React from 'react';
import {it,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {HabitatScene} from '../apps/web/src/components/habitat/HabitatScene';
import {initialState} from '../packages/simulation-engine';
import {stateSchema} from '../packages/simulation-engine/schema';
import {transition} from '../packages/simulation-engine';
afterEach(cleanup);
it('illustrated rooms support pointer and keyboard selection with accessible state',()=>{const selected=vi.fn();const {rerender}=render(<HabitatScene state={initialState()} selected="crew" onSelect={selected}/>);fireEvent.click(screen.getByRole('button',{name:'Open Power Station'}));expect(selected).toHaveBeenLastCalledWith('power');fireEvent.keyDown(screen.getByRole('button',{name:'Open Greenhouse'}),{key:'Enter'});expect(selected).toHaveBeenLastCalledWith('greenhouse');rerender(<HabitatScene state={initialState()} selected="greenhouse" onSelect={selected}/>);expect(screen.getByRole('button',{name:'Open Greenhouse'})).toHaveAttribute('aria-pressed','true');expect(screen.getAllByRole('button')).toHaveLength(8);});
it('accepts a real save with negative decision deltas and rejects corrupt resources',()=>{const state=transition(initialState(),{type:'decide',choiceId:'checklist'});expect(stateSchema.safeParse(JSON.parse(JSON.stringify(state))).success).toBe(true);state.resources.power=NaN;expect(stateSchema.safeParse(state).success).toBe(false);});
