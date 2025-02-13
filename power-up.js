TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
      text: 'Set Story Points',
      callback: function(t) {
        return t.popup({
          title: 'Set Story Points',
          url: 'story-points.html'
        });
      }
    }, {
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
      text: 'Set Parent Card',
      callback: function(t) {
        return t.popup({
          title: 'Set Parent Card',
          url: 'set-parent.html'
        });
      }
    }];
  },

  'card-badges': function(t, options) {
    return Promise.all([
      t.get('card', 'shared', 'storyPoints'),
      t.get('card', 'shared', 'parentCardName')
    ]).then(function([points, parentName]) {
      const badges = [];
      if (points) {
        badges.push({
          text: points,
          color: 'green'
        });
      }
      if (parentName) {
        badges.push({
          text: parentName,
          color: 'purple'
        });
      }
      return badges;
    });
  },

  'card-detail-badges': function(t, options) {
    return Promise.all([
      t.get('card', 'shared', 'storyPoints'),
      t.get('card', 'shared', ['parentCardId', 'parentCardName'])
    ]).then(function([points, data]) {
        const badges = [];
        if (points) {
          badges.push({
            title: 'Story Points',
            text: points
          });
        }
        if (data.parentCardId && data.parentCardName) {
          badges.push({
            title: 'Parent Card',
            text: data.parentCardName,
            callback: function(t) {
              return t.navigate({ url: `https://trello.com/c/${data.parentCardId}` });
            }
          });
        }
        return badges;
      });
  },

  'card-back-section': function(t, options) {
    return t.get('card', 'shared', 'childCards').then(function(children) {
      if (children && children.length > 0) {
        return {
          title: 'Child Cards',
          icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
          content: {
            type: 'iframe',
            url: t.signUrl('child-cards.html'),
            height: 200
          }
        };
      }
      return null;
    });
  },

  'show-settings': function(t, options) {
    return t.popup({
      title: 'Settings',
      url: 'settings.html',
      height: 184
    });
  },

  'on-enable': function(t, options) {
    console.log('Power-Up enabled');
  },

  'on-disable': function(t, options) {
    console.log('Power-Up disabled');
  }
});
