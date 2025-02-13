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
    return t.get('card', 'shared', 'storyPoints')
      .then(function(points) {
        if (points) {
          return [{
            text: points + ' SP',
            color: 'blue'
          }];
        }
        return [];
      });
  },

  'card-detail-badges': function(t, options) {
    return t.get('card', 'shared', 'parentCard')
      .then(function(parentId) {
        if (parentId) {
          return [{
            title: 'Parent Card',
            text: 'Linked',
            callback: function(t) {
              return t.board('id', 'name').then(function(board) {
                window.open(`https://trello.com/c/${parentId}`, '_blank');
              });
            }
          }];
        }
        return [];
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