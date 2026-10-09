import { ExternalLink } from 'lucide-react';
import { articleById, companyById } from '../data';
import type { NewsEvent } from '../lib/schema';

export function EventList({ events }: { events: NewsEvent[] }) {
  return <div className="event-list">{events.map(event => {
    const articles = event.articleIds.map(id => articleById.get(id)!).sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
    const first = articles[0];
    return <article key={event.id} className="event-item">
      <div className="event-meta"><time dateTime={first.publishedOn}>{first.publishedOn}</time>{first.historical ? <span className="history-label">历史依据</span> : null}</div>
      <h3>{event.title}</h3>
      <p>{event.summary}</p>
      <div className="event-companies">{event.companyIds.map(id => companyById.get(id)!.name).join(' · ')}</div>
      {event.eventDate && event.eventDate !== first.publishedOn ? <small>事件日期：{event.eventDate}</small> : null}
      <a href={first.url} target="_blank" rel="noopener noreferrer">{first.publisher} · 查看原文<ExternalLink size={13} /></a>
      {articles.length > 1 ? <details><summary>查看其他 {articles.length - 1} 篇报道</summary>{articles.slice(1).map(a => <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">{a.publisher} · {a.publishedOn}<ExternalLink size={12} /></a>)}</details> : null}
    </article>;
  })}</div>;
}
