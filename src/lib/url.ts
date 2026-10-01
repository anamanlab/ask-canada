/** URL helpers shared by the chat's source list and the widgets' source footers. */

/** The host of a URL without `www.`, for display ("canada.ca"); the input itself if it isn't a URL. */
export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** A URL without its fragment or trailing slash, for matching citations to sources. */
export const normUrl = (url: string) => url.replace(/#.*$/, '').replace(/\/$/, '');
