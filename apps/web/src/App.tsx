import {lazy,Suspense} from 'react';
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import {QueryClientProvider} from '@tanstack/react-query';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {MotionConfig} from 'framer-motion';
import {Orbit} from 'lucide-react';
import {queryClient} from './services/queryClient';
import {HabitatShell as AppShell} from './components/layout/HabitatShell';
import {ErrorBoundary} from './components/ErrorBoundary';
import {Briefing} from './pages/Launch';
import Landing from './pages/Landing';
const Mission=lazy(()=>import('./pages/Mission'));
const Science=lazy(()=>import('./pages/Science'));
const Results=lazy(()=>import('./pages/Results'));
const Profile=lazy(()=>import('./pages/Profile'));
const Journal=lazy(()=>import('./pages/Journal'));
const Explorer=lazy(()=>import('./pages/Explorer'));

export default function App(){
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipPrimitive.Provider delayDuration={200}>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <AppShell>
                <Suspense fallback={<div className="loading" role="status"><Orbit className="spin"/>Loading mission systems…</div>}>
                  <Routes>
                    <Route path="/" element={<Landing/>}/>
                    <Route path="/briefing" element={<Briefing/>}/>
                    <Route path="/mission" element={<Mission/>}/>
                    <Route path="/science" element={<Science/>}/>
                    <Route path="/results" element={<Results/>}/>
                    <Route path="/profile" element={<Profile/>}/>
                    <Route path="/journal" element={<Journal/>}/>
                    <Route path="/explorer" element={<Explorer/>}/>
                    <Route path="*" element={<div className="empty-state"><h1>Outside mission boundaries</h1><Link className="button button-primary" to="/">Return to base</Link></div>}/>
                  </Routes>
                </Suspense>
              </AppShell>
            </BrowserRouter>
          </MotionConfig>
        </TooltipPrimitive.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
