window.Shortly = Backbone.View.extend({
  template: Templates['layout'],
//added click event for logout
  events: {
    'click li a.index':  'renderIndexView',
    'click li a.create': 'renderCreateView',
    'click li a.logout': 'renderLoginView'
  },

  initialize: function(){
    console.log( 'Shortly is running' );
    $('body').append(this.render().el);

    this.router = new Shortly.Router({ el: this.$el.find('#container') });
    this.router.on('route', this.updateNav, this);

    Backbone.history.start({ pushState: true });
  },

  render: function(){
    this.$el.html( this.template() );
    return this;
  },

  renderIndexView: function(e){
    e && e.preventDefault();
    this.router.navigate('/', { trigger: true });
  },

  renderCreateView: function(e){
    e && e.preventDefault();
    this.router.navigate('/create', { trigger: true });
  },

  //added this one like a bosssss buddyyyyy
  renderLoginView: function(e){
    e && e.preventDefault();
    window.location = '/login'; 
  },

  endSession: function() {
   $.ajax("api/auth/logged_in", {
     type: "GET",
     dataType: "json",
     success: function() {
       return callback(true);
     },
     error: function() {
       return callback(false);
     }
   });    
  },

  updateNav: function(routeName){
    this.$el.find('.navigation li a')
      .removeClass('selected')
      .filter('.' + routeName)
      .addClass('selected');
  }
});
