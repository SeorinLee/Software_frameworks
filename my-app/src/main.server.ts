import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { provideClientHydration } from '@angular/platform-browser';  // Hydration을 위한 제공자 추가

// Hydration을 지원하기 위한 설정
const bootstrap = () => bootstrapApplication(AppComponent, {
  ...config,
  providers: [provideClientHydration()]  // Hydration을 위한 클라이언트 설정 추가
});

export default bootstrap;
