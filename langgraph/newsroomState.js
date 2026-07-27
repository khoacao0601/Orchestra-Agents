import { Annotation } from '@langchain/langgraph';

/**
 * Annotation definition for the LangGraph Global Newsroom State
 */
export const NewsroomStateAnnotation = Annotation.Root({
  // Command & Topic parameters
  topic: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'Global Breaking News'
  }),
  targetCategory: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'all' // 'economy', 'politics', 'weather', 'all'
  }),
  targetRegion: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'Global'
  }),
  targetLanguage: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 'en' // 'en', 'fr', 'es', 'ja', 'vi'
  }),

  // Data flowing through nodes
  rawArticles: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => []
  }),
  filteredArticles: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => []
  }),
  topicInsights: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ({})
  }),
  translatedArticles: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => []
  }),
  publishedArticles: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => []
  }),

  // Agent execution tracking and logs
  activeNodes: Annotation({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({})
  }),
  logs: Annotation({
    reducer: (x, y) => [...x, ...(Array.isArray(y) ? y : [y])],
    default: () => []
  }),
  error: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null
  })
});
