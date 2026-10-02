(function registerPagePreviews() {
  if (!window.CMS || !window.CMS.registerPreviewTemplate) return;

  var CMS = window.CMS;
  var h = CMS.h;

  CMS.registerPreviewStyle('/assets/styles.css');
  CMS.registerPreviewStyle('/assets/static-site.css');
  CMS.registerPreviewStyle('/assets/cms-pages.css');

  function value(entry, field) {
    var result = entry && entry.getIn(['data', field]);
    return result == null ? '' : result.toString();
  }

  function imageFor(entry, props) {
    var image = value(entry, 'hero_image');
    var alt = value(entry, 'hero_image_alt');
    if (!image) return null;
    var source = typeof props.getAsset === 'function' ? props.getAsset(image) : image;
    return h('img', {
      className: 'cms-page-hero-image',
      src: source && source.toString ? source.toString() : String(source || image),
      alt: alt,
      width: 1200,
      height: 750
    });
  }

  function sectionNodes(entry, fallbackSummary) {
    var sections = entry && entry.getIn(['data', 'sections']);
    var items = sections && sections.toJS ? sections.toJS() : [];
    if (!items.length && fallbackSummary) {
      items = [{ heading: 'Service overview', body: fallbackSummary }];
    }
    return items.map(function (section, index) {
      return h('section', { className: 'cms-content-section', key: 'section-' + index },
        h('h2', null, section.heading || ''),
        h('p', null, section.body || '')
      );
    });
  }

  function createPagePreview(typeLabel) {
    return CMS.createClass({
      render: function () {
        var entry = this.props.entry;
        var title = value(entry, 'title') || 'Page title';
        var heading = value(entry, 'heading') || title;
        var intro = value(entry, 'intro');
        var description = value(entry, 'description');
        var image = imageFor(entry, this.props);
        var sections = sectionNodes(entry, value(entry, 'service_summary'));

        return h('div', { className: 'cms-page' },
          h('header', { className: 'cms-header' },
            h('a', { className: 'cms-brand', href: '/' },
              h('img', { src: '/logo.jpg', alt: '', width: 54, height: 54 }),
              h('span', null, 'Prestige Flow')
            ),
            h('nav', { 'aria-label': 'Main navigation' },
              h('a', { href: '/services/' }, 'Services'),
              h('a', { href: '/industries/' }, 'Industries'),
              h('a', { href: '/areas/' }, 'Areas'),
              h('a', { href: '/contact/' }, 'Contact')
            ),
            h('a', { className: 'cms-header-call', href: 'tel:+447743565339' }, 'Call 07743 565339')
          ),
          h('main', { className: 'cms-main' },
            h('nav', { className: 'cms-breadcrumbs', 'aria-label': 'Breadcrumb' },
              h('a', { href: '/' }, 'Home'),
              h('span', { 'aria-hidden': 'true' }, '›'),
              h('span', null, typeLabel)
            ),
            h('section', { className: 'cms-hero' },
              h('div', null,
                h('p', { className: 'cms-eyebrow' }, 'Prestige Flow · ' + typeLabel),
                h('h1', null, heading),
                h('p', { className: 'cms-intro' }, intro),
                h('div', { className: 'cms-actions' },
                  h('a', { className: 'cms-button cms-button-primary', href: '/booking/' }, 'Book online'),
                  h('a', { className: 'cms-button cms-button-secondary', href: '/quote/' }, 'Request a quote')
                ),
                h('p', { className: 'cms-booking-note' }, description)
              ),
              image
            ),
            h('article', { className: 'cms-article' }, sections),
            h('section', { className: 'cms-contact' },
              h('h2', null, 'Need help with ' + heading.toLowerCase() + '?'),
              h('p', null, 'Speak with Prestige Flow about your site, symptoms or service requirements.'),
              h('a', { className: 'cms-button cms-button-primary', href: 'tel:+447743565339' }, 'Call 07743 565339')
            )
          ),
          h('footer', { className: 'cms-footer' },
            h('p', null, h('strong', null, 'Prestige Flow LTD'), ' · Drainage, plumbing and CCTV services across London and the South East.'),
            h('p', null,
              h('a', { href: '/privacy/' }, 'Privacy'), ' · ',
              h('a', { href: '/terms/' }, 'Terms'), ' · ',
              h('a', { href: '/contact/' }, 'Contact')
            )
          )
        );
      }
    });
  }

  CMS.registerPreviewTemplate('current_services', createPagePreview('Services'));
  CMS.registerPreviewTemplate('current_industries', createPagePreview('Industries'));
  CMS.registerPreviewTemplate('current_areas', createPagePreview('Areas'));
  CMS.registerPreviewTemplate('services', createPagePreview('Services'));
  CMS.registerPreviewTemplate('industries', createPagePreview('Industries'));
  CMS.registerPreviewTemplate('areas', createPagePreview('Areas'));
})();
