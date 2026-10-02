(function registerPagePreviews() {
  if (!window.CMS || !window.CMS.registerPreviewTemplate) return;

  var CMS = window.CMS;
  // Decap exposes these as classic-script globals, not properties on window.CMS
  // (and in some browsers they are global lexical bindings rather than window keys).
  var elementFactory = window.h || (typeof h === 'function' ? h : null);
  var classFactory = window.createClass || (typeof createClass === 'function' ? createClass : null);
  if (typeof elementFactory !== 'function' || typeof classFactory !== 'function') {
    console.error('Prestige Flow CMS preview helpers were not available when preview.js loaded.');
    return;
  }

  CMS.registerPreviewStyle('/assets/styles.css');
  CMS.registerPreviewStyle('/assets/static-site.css');
  CMS.registerPreviewStyle('/assets/cms-pages.css');
  CMS.registerPreviewStyle('/admin/preview.css?v=2');

  function value(entry, field) {
    var result = entry && entry.getIn(['data', field]);
    return result == null ? '' : result.toString();
  }

  function imageDetails(entry, props) {
    var image = value(entry, 'hero_image');
    var alt = value(entry, 'hero_image_alt');
    if (!image) return null;
    var source = typeof props.getAsset === 'function' ? props.getAsset(image) : image;
    return {
      source: source && source.toString ? source.toString() : String(source || image),
      alt: alt
    };
  }

  function imageFor(entry, props) {
    var image = imageDetails(entry, props);
    if (!image) return null;
    return elementFactory('img', {
      className: 'cms-page-hero-image',
      src: image.source,
      alt: image.alt,
      width: 1200,
      height: 750
    });
  }

  function currentPagePreview(entry, collectionName, props) {
    var snapshots = window.PRESTIGE_CMS_PAGE_SNAPSHOTS;
    var slug = entry && entry.get && entry.get('slug');
    if (!snapshots || !slug) return null;
    var group = collectionName.replace(/^current_/u, '');
    var markup = snapshots[group] && snapshots[group][String(slug)];
    if (!markup) return null;

    // Render the full existing page, retaining its protected sections while
    // substituting the copy currently being edited in the CMS.
    var parsed = new DOMParser().parseFromString(markup, 'text/html');
    var h1 = parsed.querySelector('main h1');
    if (!h1) return null;
    h1.textContent = value(entry, 'heading') || h1.textContent;
    var intro = h1.nextElementSibling;
    if (intro && intro.matches('p')) intro.textContent = value(entry, 'intro') || intro.textContent;

    var selectedImage = imageDetails(entry, props);
    if (intro && intro.matches('p') && selectedImage) {
      var figure = parsed.createElement('figure');
      var imageElement = parsed.createElement('img');
      figure.className = 'cms-editorial-image';
      imageElement.className = 'cms-page-hero-image';
      imageElement.src = selectedImage.source;
      imageElement.alt = selectedImage.alt;
      imageElement.width = 1200;
      imageElement.height = 750;
      imageElement.loading = 'eager';
      figure.appendChild(imageElement);
      intro.insertAdjacentElement('afterend', figure);
    }

    if (group === 'services' && slug !== 'overview') {
      var summaryHeading = parsed.querySelector('main h2');
      var summaryParagraph = summaryHeading && summaryHeading.closest('section')?.querySelector('p');
      if (summaryParagraph) summaryParagraph.textContent = value(entry, 'service_summary') || summaryParagraph.textContent;
    }

    var copyFields = entry && entry.getIn && entry.getIn(['data', 'page_copy']);
    var copyEdits = copyFields && copyFields.toJS ? copyFields.toJS() : [];
    copyEdits.forEach(function (field) {
      var match = String(field.key || '').match(/^(h2|h3|p|li|faq-answer):(\d+)$/u);
      if (!match) return;
      var target = match[1] === 'faq-answer'
        ? parsed.querySelectorAll('main [data-testid^="text-answer"]')[Number(match[2])]
        : parsed.querySelectorAll('main ' + match[1])[Number(match[2])];
      if (!target || !field.text) return;
      if (match[1] === 'faq-answer') {
        var answerCopy = target.querySelector('.leading-relaxed') || target;
        answerCopy.textContent = field.text;
      } else if (match[1] === 'h3' && target.querySelector('button')) {
        var faqButton = target.querySelector('button');
        var faqText = Array.from(faqButton.childNodes).find(function (node) { return node.nodeType === 3; });
        if (faqText) faqText.nodeValue = field.text;
      } else {
        target.textContent = field.text;
      }
    });

    parsed.querySelectorAll('script,style,iframe,object,embed').forEach(function (node) { node.remove(); });
    // Keep disclosure content visible in the CMS preview so editors can review
    // postcode lists and other details that the live page initially collapses.
    parsed.querySelectorAll('details').forEach(function (node) { node.open = true; });
    parsed.querySelectorAll('[data-testid^="text-answer"]').forEach(function (node) {
      node.removeAttribute('hidden');
      node.removeAttribute('aria-hidden');
      node.setAttribute('data-state', 'open');
    });
    parsed.querySelectorAll('*').forEach(function (node) {
      Array.from(node.attributes).forEach(function (attribute) {
        if (/^on/iu.test(attribute.name)) node.removeAttribute(attribute.name);
      });
    });
    return parsed.body.innerHTML;
  }

  function sectionNodes(entry, fallbackSummary) {
    var sections = entry && entry.getIn(['data', 'sections']);
    var items = sections && sections.toJS ? sections.toJS() : [];
    if (!items.length && fallbackSummary) {
      items = [{ heading: 'Service overview', body: fallbackSummary }];
    }
    return items.map(function (section, index) {
      return elementFactory('section', { className: 'cms-content-section', key: 'section-' + index },
        elementFactory('h2', null, section.heading || ''),
        elementFactory('p', null, section.body || '')
      );
    });
  }

  function createPagePreview(typeLabel, collectionName) {
    return classFactory({
      render: function () {
        var entry = this.props.entry;
        var pageMarkup = currentPagePreview(entry, collectionName, this.props);
        if (pageMarkup) {
          return elementFactory('div', {
            id: 'root',
            className: 'cms-source-page-preview',
            dangerouslySetInnerHTML: { __html: pageMarkup }
          });
        }
        var title = value(entry, 'title') || 'Page title';
        var heading = value(entry, 'heading') || title;
        var intro = value(entry, 'intro');
        var description = value(entry, 'description');
        var image = imageFor(entry, this.props);
        var sections = sectionNodes(entry, value(entry, 'service_summary'));

        return elementFactory('div', { className: 'cms-page' },
          elementFactory('header', { className: 'cms-header' },
            elementFactory('a', { className: 'cms-brand', href: '/' },
              elementFactory('img', { src: '/logo.jpg', alt: '', width: 54, height: 54 }),
              elementFactory('span', null, 'Prestige Flow')
            ),
            elementFactory('nav', { 'aria-label': 'Main navigation' },
              elementFactory('a', { href: '/services/' }, 'Services'),
              elementFactory('a', { href: '/industries/' }, 'Industries'),
              elementFactory('a', { href: '/areas/' }, 'Areas'),
              elementFactory('a', { href: '/contact/' }, 'Contact')
            ),
            elementFactory('a', { className: 'cms-header-call', href: 'tel:+447743565339' }, 'Call 07743 565339')
          ),
          elementFactory('main', { className: 'cms-main' },
            elementFactory('nav', { className: 'cms-breadcrumbs', 'aria-label': 'Breadcrumb' },
              elementFactory('a', { href: '/' }, 'Home'),
              elementFactory('span', { 'aria-hidden': 'true' }, '›'),
              elementFactory('span', null, typeLabel)
            ),
            elementFactory('section', { className: 'cms-hero' },
              elementFactory('div', null,
                elementFactory('p', { className: 'cms-eyebrow' }, 'Prestige Flow · ' + typeLabel),
                elementFactory('h1', null, heading),
                elementFactory('p', { className: 'cms-intro' }, intro),
                elementFactory('div', { className: 'cms-actions' },
                  elementFactory('a', { className: 'cms-button cms-button-primary', href: '/booking/' }, 'Book online'),
                  elementFactory('a', { className: 'cms-button cms-button-secondary', href: '/quote/' }, 'Request a quote')
                ),
                elementFactory('p', { className: 'cms-booking-note' }, description)
              ),
              image
            ),
            elementFactory('article', { className: 'cms-article' }, sections),
            elementFactory('section', { className: 'cms-contact' },
              elementFactory('h2', null, 'Need help with ' + heading.toLowerCase() + '?'),
              elementFactory('p', null, 'Speak with Prestige Flow about your site, symptoms or service requirements.'),
              elementFactory('a', { className: 'cms-button cms-button-primary', href: 'tel:+447743565339' }, 'Call 07743 565339')
            )
          ),
          elementFactory('footer', { className: 'cms-footer' },
            elementFactory('p', null, elementFactory('strong', null, 'Prestige Flow LTD'), ' · Drainage, plumbing and CCTV services across London and the South East.'),
            elementFactory('p', null,
              elementFactory('a', { href: '/privacy/' }, 'Privacy'), ' · ',
              elementFactory('a', { href: '/terms/' }, 'Terms'), ' · ',
              elementFactory('a', { href: '/contact/' }, 'Contact')
            )
          )
        );
      }
    });
  }

  CMS.registerPreviewTemplate('current_services', createPagePreview('Services', 'current_services'));
  CMS.registerPreviewTemplate('current_industries', createPagePreview('Industries', 'current_industries'));
  CMS.registerPreviewTemplate('current_areas', createPagePreview('Areas', 'current_areas'));
  CMS.registerPreviewTemplate('services', createPagePreview('Services', 'services'));
  CMS.registerPreviewTemplate('industries', createPagePreview('Industries', 'industries'));
  CMS.registerPreviewTemplate('areas', createPagePreview('Areas', 'areas'));
})();
