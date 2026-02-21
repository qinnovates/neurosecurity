#!/usr/bin/env python3
"""
ONI Framework - Continuous Research Delivery Monitor
=====================================================

Monitors academic sources for new publications related to the ONI Framework
research topics. Uses keywords extracted from existing publications to find
relevant new research.

Sources:
- arXiv (cs.CR, q-bio.NC, cs.AI)
- PubMed / PMC
- bioRxiv / medRxiv
- IEEE Xplore
- Semantic Scholar

Usage:
    python research_monitor.py [--days 7] [--sources all] [--keywords-file path]

Options:
    --days          Number of days to look back (default: 7)
    --sources       Comma-separated list of sources or 'all' (default: all)
                    Available: arxiv, pubmed, biorxiv, ieee, semantic_scholar
    --keywords-file Path to keywords.json (default: auto-detect)
    --update-keywords  Re-extract keywords from publications (future feature)

Author: ONI Framework
Version: 2.0
Last Updated: January 2026
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List
from urllib.parse import quote_plus, urlencode
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import xml.etree.ElementTree as ET

# Configuration
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent  # Up to ONI/
PIPELINE_DIR = PROJECT_ROOT / "MAIN" / "resources" / "pipeline"
PIPELINE_INCOMING = PIPELINE_DIR / "incoming"
KEYWORDS_FILE = SCRIPT_DIR / "keywords.json"  # Same directory as script


class KeywordManager:
    """Manages research keywords extracted from publications."""

    def __init__(self, keywords_file: Path = KEYWORDS_FILE):
        self.keywords_file = keywords_file
        self.keywords_data = self._load_keywords()

    def _load_keywords(self) -> Dict:
        """Load keywords from JSON file."""
        if self.keywords_file.exists():
            with open(self.keywords_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"combined_search_terms": {}, "publications": {}}

    def get_search_terms(self, category: str = None) -> List[str]:
        """Get search terms, optionally filtered by category."""
        combined = self.keywords_data.get("combined_search_terms", {})

        if category and category in combined:
            return combined[category]

        # Return all combined terms
        all_terms = []
        for terms in combined.values():
            all_terms.extend(terms)
        return list(set(all_terms))

    def get_publication_keywords(self, publication: str) -> List[str]:
        """Get keywords for a specific publication."""
        pubs = self.keywords_data.get("publications", {})
        if publication in pubs:
            pub_data = pubs[publication]
            keywords = []
            for key in ["primary_keywords", "technical_terms", "security_terms"]:
                keywords.extend(pub_data.get(key, []))
            return keywords
        return []

    def get_all_keywords(self) -> List[str]:
        """Get all unique keywords across all publications."""
        all_kw = set()

        # From publications
        for pub_data in self.keywords_data.get("publications", {}).values():
            for key in pub_data:
                if isinstance(pub_data[key], list):
                    all_kw.update(pub_data[key])

        # From combined terms
        for terms in self.keywords_data.get("combined_search_terms", {}).values():
            all_kw.update(terms)

        return list(all_kw)


class ResearchMonitor:
    """Monitor academic sources for relevant research."""

    def __init__(self, days_back: int = 7, verbose: bool = True,
                 keywords_manager: KeywordManager = None):
        self.days_back = days_back
        self.verbose = verbose
        self.results = []
        self.start_date = datetime.now() - timedelta(days=days_back)
        self.km = keywords_manager or KeywordManager()

        # Get search terms from keywords
        self.search_terms = self._build_search_terms()

    def _build_search_terms(self) -> List[str]:
        """Build prioritized list of search terms."""
        terms = []

        # Priority 1: Core BCI security terms
        terms.extend(self.km.get_search_terms("core_BCI_security")[:5])

        # Priority 2: Threat modeling
        terms.extend(self.km.get_search_terms("threat_modeling")[:3])

        # Priority 3: Signal processing
        terms.extend(self.km.get_search_terms("signal_processing")[:3])

        # Priority 4: Privacy/ethics
        terms.extend(self.km.get_search_terms("privacy_ethics")[:2])

        # Deduplicate while preserving order
        seen = set()
        unique_terms = []
        for term in terms:
            if term not in seen:
                seen.add(term)
                unique_terms.append(term)

        return unique_terms[:15]  # Limit to avoid rate limiting

    def log(self, message: str):
        """Print message if verbose mode is enabled."""
        if self.verbose:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def search_arxiv(self) -> List[Dict]:
        """Search arXiv for relevant papers."""
        self.log("Searching arXiv...")
        papers = []

        # arXiv categories relevant to ONI
        categories = ["cs.CR", "q-bio.NC", "cs.AI", "cs.NE", "eess.SP"]

        for term in self.search_terms[:5]:  # Limit queries
            try:
                query = quote_plus(term)
                cat_filter = "+OR+".join([f"cat:{cat}" for cat in categories])
                url = (
                    f"http://export.arxiv.org/api/query?"
                    f"search_query=all:{query}+AND+({cat_filter})&"
                    f"start=0&max_results=10&"
                    f"sortBy=submittedDate&sortOrder=descending"
                )

                req = Request(url, headers={'User-Agent': 'ONI-Research-Monitor/2.0'})
                with urlopen(req, timeout=30) as response:
                    data = response.read().decode('utf-8')

                root = ET.fromstring(data)
                ns = {'atom': 'http://www.w3.org/2005/Atom'}

                for entry in root.findall('atom:entry', ns):
                    title = entry.find('atom:title', ns)
                    summary = entry.find('atom:summary', ns)
                    published = entry.find('atom:published', ns)
                    link = entry.find('atom:id', ns)

                    # Get categories
                    cats = [c.get('term') for c in entry.findall('atom:category', ns)]

                    if title is not None and published is not None:
                        pub_date = datetime.fromisoformat(
                            published.text.replace('Z', '+00:00')
                        ).replace(tzinfo=None)

                        if pub_date >= self.start_date:
                            papers.append({
                                'title': title.text.strip().replace('\n', ' '),
                                'abstract': summary.text.strip() if summary is not None else '',
                                'date': pub_date.strftime('%Y-%m-%d'),
                                'url': link.text if link is not None else '',
                                'source': 'arxiv',
                                'categories': cats,
                                'search_term': term
                            })

            except (URLError, HTTPError, ET.ParseError) as e:
                self.log(f"  Warning: arXiv search failed for '{term}': {e}")
                continue

        return self._deduplicate(papers)

    def search_pubmed(self) -> List[Dict]:
        """Search PubMed for relevant papers."""
        self.log("Searching PubMed...")
        papers = []

        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

        for term in self.search_terms[:5]:
            try:
                # Add medical/neuro context to search
                enhanced_term = f"{term} AND (brain computer interface OR neural interface OR neuromodulation)"
                search_url = (
                    f"{base_url}/esearch.fcgi?"
                    f"db=pubmed&term={quote_plus(enhanced_term)}&"
                    f"retmax=10&sort=date&retmode=json&"
                    f"mindate={self.start_date.strftime('%Y/%m/%d')}"
                )

                req = Request(search_url, headers={'User-Agent': 'ONI-Research-Monitor/2.0'})
                with urlopen(req, timeout=30) as response:
                    search_data = json.loads(response.read().decode('utf-8'))

                id_list = search_data.get('esearchresult', {}).get('idlist', [])

                if not id_list:
                    continue

                # Fetch details
                ids = ','.join(id_list)
                fetch_url = f"{base_url}/esummary.fcgi?db=pubmed&id={ids}&retmode=json"

                req = Request(fetch_url, headers={'User-Agent': 'ONI-Research-Monitor/2.0'})
                with urlopen(req, timeout=30) as response:
                    fetch_data = json.loads(response.read().decode('utf-8'))

                results = fetch_data.get('result', {})

                for pmid in id_list:
                    if pmid in results:
                        paper = results[pmid]
                        papers.append({
                            'title': paper.get('title', 'Unknown'),
                            'abstract': '',
                            'date': paper.get('pubdate', ''),
                            'url': f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                            'source': 'pubmed',
                            'journal': paper.get('source', ''),
                            'search_term': term
                        })

            except (URLError, HTTPError, json.JSONDecodeError) as e:
                self.log(f"  Warning: PubMed search failed for '{term}': {e}")
                continue

        return self._deduplicate(papers)

    def search_biorxiv(self) -> List[Dict]:
        """Search bioRxiv and medRxiv for relevant preprints."""
        self.log("Searching bioRxiv/medRxiv...")
        papers = []

        start = self.start_date.strftime('%Y-%m-%d')
        end = datetime.now().strftime('%Y-%m-%d')

        for server in ['biorxiv', 'medrxiv']:
            try:
                url = f"https://api.biorxiv.org/details/{server}/{start}/{end}/0/100"
                req = Request(url, headers={'User-Agent': 'ONI-Research-Monitor/2.0'})

                with urlopen(req, timeout=30) as response:
                    data = json.loads(response.read().decode('utf-8'))

                collection = data.get('collection', [])

                # Filter for relevant papers using keywords
                keywords = ['brain', 'neural', 'bci', 'interface', 'cognitive', 'neuro',
                           'implant', 'electrode', 'stimulation', 'security', 'privacy']

                for paper in collection:
                    title = paper.get('title', '').lower()
                    abstract = paper.get('abstract', '').lower()

                    if any(kw in title or kw in abstract for kw in keywords):
                        papers.append({
                            'title': paper.get('title', 'Unknown'),
                            'abstract': paper.get('abstract', ''),
                            'date': paper.get('date', ''),
                            'url': f"https://www.{server}.org/content/{paper.get('doi', '')}",
                            'source': server,
                            'search_term': 'neural/brain keywords'
                        })

            except (URLError, HTTPError, json.JSONDecodeError) as e:
                self.log(f"  Warning: {server} search failed: {e}")

        return self._deduplicate(papers)

    def search_semantic_scholar(self) -> List[Dict]:
        """Search Semantic Scholar API for relevant papers."""
        self.log("Searching Semantic Scholar...")
        papers = []

        base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

        for term in self.search_terms[:3]:  # Limit due to rate limits
            try:
                params = {
                    'query': term,
                    'limit': 10,
                    'fields': 'title,abstract,url,year,publicationDate,venue',
                    'year': f'{self.start_date.year}-'
                }
                url = f"{base_url}?{urlencode(params)}"

                req = Request(url, headers={
                    'User-Agent': 'ONI-Research-Monitor/2.0',
                    'Accept': 'application/json'
                })

                with urlopen(req, timeout=30) as response:
                    data = json.loads(response.read().decode('utf-8'))

                for paper in data.get('data', []):
                    pub_date = paper.get('publicationDate', '')
                    if pub_date:
                        try:
                            date_obj = datetime.strptime(pub_date, '%Y-%m-%d')
                            if date_obj < self.start_date:
                                continue
                        except ValueError:
                            pass

                    papers.append({
                        'title': paper.get('title', 'Unknown'),
                        'abstract': paper.get('abstract', '') or '',
                        'date': pub_date or str(paper.get('year', '')),
                        'url': paper.get('url', ''),
                        'source': 'semantic_scholar',
                        'venue': paper.get('venue', ''),
                        'search_term': term
                    })

            except (URLError, HTTPError, json.JSONDecodeError) as e:
                self.log(f"  Warning: Semantic Scholar search failed for '{term}': {e}")
                continue

        return self._deduplicate(papers)

    def search_ieee(self) -> List[Dict]:
        """
        Search IEEE Xplore (requires API key).
        Returns empty list if API key not configured.
        """
        self.log("Searching IEEE Xplore...")

        # Check for API key
        api_key = os.environ.get('IEEE_API_KEY')
        if not api_key:
            self.log("  IEEE API key not found. Set IEEE_API_KEY environment variable.")
            self.log("  Get API key at: https://developer.ieee.org/")
            return []

        papers = []
        base_url = "https://ieeexploreapi.ieee.org/api/v1/search/articles"

        for term in self.search_terms[:3]:
            try:
                params = {
                    'apikey': api_key,
                    'querytext': term,
                    'max_records': 10,
                    'start_year': self.start_date.year,
                    'sort_order': 'desc',
                    'sort_field': 'publication_date'
                }
                url = f"{base_url}?{urlencode(params)}"

                req = Request(url, headers={'Accept': 'application/json'})
                with urlopen(req, timeout=30) as response:
                    data = json.loads(response.read().decode('utf-8'))

                for article in data.get('articles', []):
                    papers.append({
                        'title': article.get('title', 'Unknown'),
                        'abstract': article.get('abstract', ''),
                        'date': article.get('publication_date', ''),
                        'url': article.get('html_url', ''),
                        'source': 'ieee',
                        'venue': article.get('publication_title', ''),
                        'search_term': term
                    })

            except (URLError, HTTPError, json.JSONDecodeError) as e:
                self.log(f"  Warning: IEEE search failed for '{term}': {e}")
                continue

        return self._deduplicate(papers)

    def _deduplicate(self, papers: List[Dict]) -> List[Dict]:
        """Remove duplicate papers by title."""
        seen = set()
        unique = []
        for paper in papers:
            title_key = paper['title'].lower().strip()
            if title_key not in seen:
                seen.add(title_key)
                unique.append(paper)
        return unique

    def _calculate_relevance(self, paper: Dict) -> float:
        """Calculate relevance score based on keyword matches."""
        text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()

        score = 0.0
        all_keywords = self.km.get_all_keywords()

        for kw in all_keywords:
            if kw.lower() in text:
                score += 1.0

        # Normalize by number of keywords
        if all_keywords:
            score = score / len(all_keywords) * 100

        return round(score, 2)

    def run_search(self, sources: List[str]) -> List[Dict]:
        """Run search across specified sources."""
        all_papers = []

        source_methods = {
            'arxiv': self.search_arxiv,
            'pubmed': self.search_pubmed,
            'biorxiv': self.search_biorxiv,
            'semantic_scholar': self.search_semantic_scholar,
            'ieee': self.search_ieee,
        }

        for source in sources:
            if source in source_methods:
                try:
                    papers = source_methods[source]()
                    # Add relevance scores
                    for paper in papers:
                        paper['relevance_score'] = self._calculate_relevance(paper)
                    all_papers.extend(papers)
                    self.log(f"  Found {len(papers)} papers from {source}")
                except Exception as e:
                    self.log(f"Error searching {source}: {e}")

        # Sort by relevance
        all_papers.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)

        # Final deduplication across sources
        self.results = self._deduplicate(all_papers)
        return self.results

    def save_results(self) -> List[str]:
        """Save results to pipeline/incoming folder."""
        saved_files = []

        PIPELINE_INCOMING.mkdir(parents=True, exist_ok=True)

        for paper in self.results:
            date = paper.get('date', datetime.now().strftime('%Y-%m-%d'))
            if len(date) > 10:
                date = date[:10]

            # Sanitize title for filename
            title_slug = re.sub(r'[^\w\s-]', '', paper['title'].lower())
            title_slug = re.sub(r'[\s_]+', '-', title_slug)[:50]

            filename = f"{date}_{paper['source']}_{title_slug}.md"
            filepath = PIPELINE_INCOMING / filename

            if filepath.exists():
                continue

            # Determine relevance checkboxes based on score
            relevance = paper.get('relevance_score', 0)
            checks = []
            if relevance > 20:
                checks.append("- [x] High relevance to ONI Framework")
            if 'security' in paper.get('title', '').lower() or 'security' in paper.get('abstract', '').lower():
                checks.append("- [x] Contains security content")
            if 'bci' in paper.get('title', '').lower() or 'brain-computer' in paper.get('abstract', '').lower():
                checks.append("- [x] BCI-related")

            content = f"""# {paper['title']}

## Metadata
- **Source:** {paper['source']}
- **Date:** {paper['date']}
- **URL:** {paper['url']}
- **Search Term:** {paper['search_term']}
- **Relevance Score:** {paper.get('relevance_score', 'N/A')}%
- **Retrieved:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Abstract

{paper['abstract'] if paper['abstract'] else '*Abstract not available - visit URL for full paper*'}

## Relevance to ONI Framework

*Auto-assessed based on keyword matching:*

{chr(10).join(checks) if checks else '- [ ] Needs manual review'}

### Manual Review Checklist
- [ ] Relevant to neural security
- [ ] Relevant to BCI architecture
- [ ] Relevant to coherence/signal integrity
- [ ] Contains novel attack vectors
- [ ] Contains defensive strategies
- [ ] Background/foundational research
- [ ] Should be cited in future work

## Notes

*Add review notes here*

---
*Auto-generated by ONI Research Monitor v2.0*
*Keywords file: {self.km.keywords_file}*
"""

            try:
                filepath.write_text(content, encoding='utf-8')
                saved_files.append(str(filepath))
                self.log(f"  Saved: {filename}")
            except IOError as e:
                self.log(f"  Error saving {filename}: {e}")

        return saved_files

    def generate_summary(self) -> str:
        """Generate a summary report of the search."""
        summary = f"""
# ONI Research Monitor - Summary Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
Search Period: Last {self.days_back} days
Keywords File: {self.km.keywords_file}

## Search Terms Used
{chr(10).join(f'- {term}' for term in self.search_terms[:10])}

## Results Overview
- **Total papers found:** {len(self.results)}
- **High relevance (>20%):** {len([p for p in self.results if p.get('relevance_score', 0) > 20])}

### By Source:
"""
        source_counts = {}
        for paper in self.results:
            source = paper['source']
            source_counts[source] = source_counts.get(source, 0) + 1

        for source, count in sorted(source_counts.items()):
            summary += f"- {source}: {count}\n"

        summary += "\n## Top Relevant Papers\n\n"

        for i, paper in enumerate(self.results[:15], 1):
            rel = paper.get('relevance_score', 0)
            summary += f"{i}. **{paper['title'][:80]}{'...' if len(paper['title']) > 80 else ''}**\n"
            summary += f"   - Source: {paper['source']} | Date: {paper['date']} | Relevance: {rel}%\n"
            summary += f"   - URL: {paper['url']}\n\n"

        return summary


def main():
    parser = argparse.ArgumentParser(
        description='ONI Framework Research Monitor - Fetch latest academic publications'
    )
    parser.add_argument(
        '--days', type=int, default=7,
        help='Number of days to look back (default: 7)'
    )
    parser.add_argument(
        '--sources', type=str, default='all',
        help='Comma-separated sources: arxiv,pubmed,biorxiv,semantic_scholar,ieee or "all"'
    )
    parser.add_argument(
        '--keywords-file', type=str, default=None,
        help='Path to keywords.json file'
    )
    parser.add_argument(
        '--quiet', action='store_true',
        help='Suppress progress output'
    )
    parser.add_argument(
        '--summary-only', action='store_true',
        help='Only print summary, do not save files'
    )

    args = parser.parse_args()

    # Parse sources
    if args.sources == 'all':
        sources = ['arxiv', 'pubmed', 'biorxiv', 'semantic_scholar', 'ieee']
    else:
        sources = [s.strip().lower() for s in args.sources.split(',')]

    # Load keywords
    kw_file = Path(args.keywords_file) if args.keywords_file else KEYWORDS_FILE
    km = KeywordManager(kw_file)

    print("=" * 60)
    print("ONI Framework - Continuous Research Delivery Monitor v2.0")
    print("=" * 60)
    print(f"Searching for papers from the last {args.days} days...")
    print(f"Sources: {', '.join(sources)}")
    print(f"Keywords file: {kw_file}")
    print()

    # Run monitor
    monitor = ResearchMonitor(
        days_back=args.days,
        verbose=not args.quiet,
        keywords_manager=km
    )
    monitor.run_search(sources)

    print()
    print("-" * 60)

    if not args.summary_only:
        saved = monitor.save_results()
        print(f"\nSaved {len(saved)} new papers to: {PIPELINE_INCOMING}")

    print(monitor.generate_summary())

    print("-" * 60)
    print("Monitor complete. Review papers in resources/pipeline/incoming/ folder.")
    print("Move reviewed papers to resources/pipeline/processed/ when done.")


if __name__ == '__main__':
    main()
