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
          text: points + ' SP',
          color: 'blue'
        });
      }
      if (parentName) {
        badges.push({
          text: 'Parent: ' + parentName,
          color: 'green'
        });
      }
      return badges;
    });
  },

  'card-detail-badges': function(t, options) {
    return Promise.all([
      t.get('card', 'shared', 'storyPoints'),
      t.get('card', 'shared', 'parentCardName')
    ]).then(function([points, parentName]) {
      const badges = [];
      if (points) {
        badges.push({
          title: 'Story Points',
          text: points + ' SP',
          color: 'blue'
        });
      }
      if (parentName) {
        badges.push({
          title: 'Parent Card',
          text: parentName
        });
      }
      return badges;
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