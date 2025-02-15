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

  'card-detail-badges': function (t, options) {
    return Promise.all([
      t.get('card', 'shared', 'storyPoints'),
      t.get('card', 'shared', 'parentCardId'),
      t.get('card', 'shared', 'parentCardName')
    ]).then(function ([points, parentCardId, parentCardName]) {
      const badges = [];

      if (points) {
        badges.push({
          title: 'Story Points',
          text: points + ' SP',
          color: 'blue'
        });
      }

      if (parentCardId && parentCardName) {
        badges.push({
          title: 'Parent Card',
          text: parentCardName,
          callback: function (t) {
            return t.navigate({
              url: `https://trello.com/c/${parentCardId}`,
              target: 'current'
            });
          }
        });
      }

      return badges;
    }).catch(error => {
      console.error('Error in card-detail-badges:', error);
      return [];
    });
  },

  'attachment-sections': function (t, options) {
    return t.get('board', 'shared', 'childCards').then(function (boardChildren) {
      var children = (boardChildren && boardChildren[parentCardId]) || [];
      if (children.length === 0) {
        return [];
      }
      return [
        {
          claimed: children.map(child => `https://trello.com/c/${child.id}`),
          icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
          title: 'Child Cards',
          content: {
            type: 'iframe',
            url: t.signUrl('attachments.html')
          }
        }
      ];
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
