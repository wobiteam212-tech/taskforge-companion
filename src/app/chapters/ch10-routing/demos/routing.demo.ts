import { Component, computed, signal } from '@angular/core';

interface MatchResult {
  record: string;
  lazy: boolean;
  params: { name: string; value: string }[];
  query: { name: string; value: string }[];
  guard: 'pass' | 'redirect' | 'none';
  resolver: boolean;
  component: string;
}

/** the seeded project ids the guard knows about — mirrors ProjectsStore */
const KNOWN_IDS = [1, 2, 3];

/**
 * Route-matching playground: type a URL and watch the router's decision —
 * which record matched, the extracted params, the guard verdict and whether
 * a resolver ran. The matching logic mirrors the actual taught routes table.
 */
@Component({
  selector: 'demo-routing',
  templateUrl: './routing.demo.html',
  styleUrl: './routing.demo.scss',
})
export class RoutingDemo {
  protected readonly url = signal('/projects/2?status=Open');

  protected readonly presets = ['/', '/projects/2', '/projects/99', '/projects/3?status=Done', '/nowhere'];

  protected readonly result = computed<MatchResult>(() => {
    const { pathPart, queryPart } = this.parseInput(this.url());
    const segments = pathPart.split('/').filter(Boolean);
    const query = (queryPart ?? '')
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const [name, value] = pair.split('=');
        return { name, value: value ?? '' };
      });

    if (segments.length === 0) {
      return { record: `path: ''`, lazy: false, params: [], query, guard: 'none', resolver: false, component: 'ProjectList' };
    }

    if (segments.length === 2 && segments[0] === 'projects') {
      const id = segments[1];
      const pass = KNOWN_IDS.includes(Number(id));
      return {
        record: `path: 'projects/:projectId'`,
        lazy: true,
        params: [{ name: 'projectId', value: id }],
        query,
        guard: pass ? 'pass' : 'redirect',
        resolver: pass,
        component: pass ? 'ProjectBoard' : '(redirect to /)',
      };
    }

    return { record: `path: '**'`, lazy: true, params: [], query, guard: 'none', resolver: false, component: 'NotFound' };
  });

  protected setUrl(value: string): void {
    this.url.set(value);
  }

  private parseInput(input: string): { pathPart: string; queryPart: string } {
    let raw = input.trim() || '/';
    if (/^[\w.-]+:\d+(?:\/|$)/.test(raw)) raw = `http://${raw}`;

    try {
      const parsed = new URL(raw, 'http://localhost:4500');
      const routed = parsed.hash.startsWith('#/') ? parsed.hash.slice(1) : `${parsed.pathname}${parsed.search}`;
      const [pathPart, queryPart = ''] = routed.split('?');
      return { pathPart, queryPart };
    } catch {
      const [pathPart, queryPart = ''] = raw.split('?');
      return { pathPart, queryPart };
    }
  }
}
