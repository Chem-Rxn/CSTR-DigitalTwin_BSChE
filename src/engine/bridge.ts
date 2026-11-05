import { useSimulationStore } from '@/store/useSimulationStore';
import { rk4, PID, TC_MIN, TC_MAX, calcRateK } from './physics';

export function startEngine(): () => void {
  const store = useSimulationStore;
  const pid = new PID();

  let lastTime = performance.now();
  let accumulatedTime = 0;
  let animationFrameId: number;
  let wasAuto = store.getState().pid.auto; // for bumpless manual -> auto transfer
  let lastTc = store.getState().pid.manualTc;

  const initialPid = store.getState().pid;
  if (initialPid.auto) {
    pid.bumpless(initialPid, store.getState().live.T, initialPid.manualTc);
  }

  const loop = (currentTime: number) => {
    const dtReal = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    const state = store.getState();
    if (state.running && !state.exploded) {
      accumulatedTime += Math.min(dtReal, 0.1) * state.speed;
      const simDt = 0.05;

      while (accumulatedTime >= simDt) {
        accumulatedTime -= simDt;

        const currentLive = store.getState().live;
        const currentParams = store.getState().params;
        const currentPid = store.getState().pid;

        if (currentPid.auto && !wasAuto) pid.bumpless(currentPid, currentLive.T, lastTc);
        wasAuto = currentPid.auto;

        const tc = currentPid.auto
          ? pid.step(currentPid, currentLive.T, simDt)
          : Math.min(TC_MAX, Math.max(TC_MIN, currentPid.manualTc));

        lastTc = tc;

        const vecState = { CA: currentLive.CA, CB: currentLive.CB, T: currentLive.T };

        const nSteps = 5;
        const h = simDt / nSteps;
        let nextVec = vecState;
        for (let i = 0; i < nSteps; i++) {
          nextVec = rk4(nextVec, tc, currentParams, h);
        }

        const newTime = currentLive.t + simDt;
        const conversion = Math.max(0, Math.min(1, (currentParams.CAO - nextVec.CA) / currentParams.CAO));
        const k = calcRateK(nextVec.T, currentParams);
        const r = k * Math.pow(Math.max(0, nextVec.CA), currentParams.orderA) * Math.pow(Math.max(0, nextVec.CB), currentParams.orderB);
        const heatGen = r * currentParams.dH * currentParams.V;
        const tau = currentParams.V / currentParams.F;
        const damkohler = k * tau;

        // Explosion trigger threshold set at 430 K for rapid testing
        const isExploded = nextVec.T >= 430;

        store.getState().applySnapshot({
          t: newTime,
          CA: nextVec.CA,
          CB: nextVec.CB,
          T: nextVec.T,
          Tc: tc,
          Tsp: currentPid.Tsp,
          conversion,
          heatGen,
          damkohler,
          exploded: isExploded,
        });

        if (isExploded) {
          store.getState().setRunning(false);
          break;
        }
      }
    }

    animationFrameId = requestAnimationFrame(loop);
  };

  animationFrameId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(animationFrameId);
}