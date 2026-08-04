import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../../core/services/websocket.service';
import { Article, ArticleComment } from '../../core/models/news.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reader-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reader-portal.component.html',
  styleUrls: ['./reader-portal.component.css']
})
export class ReaderPortalComponent implements OnInit, OnDestroy {
  public searchTopic = '';
  public currentCategory = 'all';
  public currentRegion = 'Global';
  public currentLanguage = 'en';

  public newCommentName = '';
  public newCommentText = '';

  public allArticles = signal<Article[]>([]);
  public filteredArticles = signal<Article[]>([]);
  public selectedArticle = signal<Article | null>(null);
  public isLoading = signal<boolean>(false);
  public tickerText = signal<string>('Fetching real-time global news coverage...');
  public wireStatus = signal<string>('LIVE WIRE UPDATED');

  public activeModalComments = computed<ArticleComment[]>(() => {
    const art = this.selectedArticle();
    if (!art) return [];
    // Find updated article from signal state to get dynamic comment count/likes
    const current = this.allArticles().find(a => a.id === art.id);
    return current?.comments || art.comments || [];
  });

  private sub!: Subscription;

  constructor(private wsService: WebSocketService) {}

  ngOnInit(): void {
    this.sub = this.wsService.articles$.subscribe(articles => {
      this.allArticles.set(articles);
      this.applyFilters();
      this.isLoading.set(false);
      if (articles.length > 0) {
        this.tickerText.set(`🔥 JUST PUBLISHED: ${articles[0].title}`);
      }
    });

    this.wsService.pipelineStatus$.subscribe(status => {
      if (status === 'running') {
        this.isLoading.set(true);
        this.wireStatus.set('UPDATING WIRE');
      } else if (status === 'completed') {
        this.isLoading.set(false);
        this.wireStatus.set('LIVE WIRE UPDATED');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  public setCategory(cat: string): void {
    this.currentCategory = cat;
    this.applyFilters();
  }

  public onRegionChange(): void {
    this.applyFilters();
  }

  public onLanguageChange(): void {
    this.onSearch();
  }

  public onSearch(): void {
    const topic = this.searchTopic.trim() || 'Global Breaking News';
    this.isLoading.set(true);
    this.wsService.dispatchNewsPipeline(topic, this.currentCategory, this.currentRegion, this.currentLanguage);
  }

  private applyFilters(): void {
    const articles = this.allArticles();
    const filtered = articles.filter(art => {
      const matchCategory = this.currentCategory === 'all' || art.category === this.currentCategory;
      const matchRegion = this.currentRegion === 'Global' || art.region?.includes(this.currentRegion) || art.region === 'Global Wire';
      return matchCategory && matchRegion;
    });
    this.filteredArticles.set(filtered);
  }

  public openModal(article: Article): void {
    this.selectedArticle.set(article);
    this.newCommentName = '';
    this.newCommentText = '';
  }

  public closeModal(): void {
    this.selectedArticle.set(null);
  }

  public closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  public speakArticle(): void {
    const art = this.selectedArticle();
    if (art && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `${art.title}. ${art.tldr}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  public getArticleComments(articleId: string): ArticleComment[] {
    const art = this.allArticles().find(a => a.id === articleId);
    return art?.comments || [];
  }

  public submitComment(): void {
    const art = this.selectedArticle();
    if (!art || !this.newCommentText.trim()) return;

    this.wsService.addComment(art.id, this.newCommentName, this.newCommentText);
    this.newCommentText = '';
  }

  public likeComment(commentId: string): void {
    const art = this.selectedArticle();
    if (!art) return;

    this.wsService.likeComment(art.id, commentId);
  }
}
