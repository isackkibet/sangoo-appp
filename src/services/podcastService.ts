import { Podcast, defaultPodcasts } from '../constants/articles';

const STORAGE_KEY = 'sango_podcasts';

const hasSupabase =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

export const podcastService = {
  getPodcasts: async (): Promise<Podcast[]> => {
    if (!hasSupabase) return getPodcastsFromStorage();

    try {
      const { supabase } = await import('../utils/supabase/client');
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) return getPodcastsFromStorage();

      return data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        title: p.title as string,
        episode: (p.episode || p.description) as string,
        duration: p.duration as string,
        image: (p.image || p.image_url) as string,
        type: 'podcast' as const,
      }));
    } catch {
      return getPodcastsFromStorage();
    }
  },

  addPodcast: async (podcast: Podcast): Promise<void> => {
    if (!hasSupabase) { addPodcastToStorage(podcast); return; }
    try {
      const { supabase } = await import('../utils/supabase/client');
      const { error } = await supabase.from('podcasts').insert([podcast]);
      if (error) addPodcastToStorage(podcast);
    } catch {
      addPodcastToStorage(podcast);
    }
  },

  deletePodcast: async (id: string): Promise<void> => {
    if (!hasSupabase) { deletePodcastFromStorage(id); return; }
    try {
      const { supabase } = await import('../utils/supabase/client');
      const { error } = await supabase.from('podcasts').delete().eq('id', id);
      if (error) deletePodcastFromStorage(id);
    } catch {
      deletePodcastFromStorage(id);
    }
  },
};

const getPodcastsFromStorage = (): Podcast[] => {
  if (typeof window === 'undefined') return defaultPodcasts;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Podcast[]) : defaultPodcasts;
};

const addPodcastToStorage = (podcast: Podcast) => {
  const list = getPodcastsFromStorage();
  if (typeof window !== 'undefined')
    localStorage.setItem(STORAGE_KEY, JSON.stringify([podcast, ...list]));
};

const deletePodcastFromStorage = (id: string) => {
  const list = getPodcastsFromStorage().filter(p => p.id !== id);
  if (typeof window !== 'undefined')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};
