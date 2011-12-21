
module.exports = {
 
  index: function(req, res){
	var user = req.session.user;
	if(req.session.user.role === 'admin') res.redirect('/admin');
	if(req.session.user.role === 'manager') res.redirect('/manager');
  }
};
