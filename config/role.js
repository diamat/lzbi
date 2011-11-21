
exports.RoleAccess = function RoleAccess (role, action, menu, uid, cid) {
	switch(menu){
		case 'customers': 
			switch(action){
				case 'id': {
					if(role === 'manager' && uid == cid) return 1;
				}
				case 'edit':{
					if(role === 'manager' && uid == cid) return 1;
				}
			}
		case 'orders': 
			switch(action){
				case 'id': {
					if(role === 'manager' && uid == cid) return 1;
				}
				case 'edit':{
					if(role === 'manager' && uid == cid) return 1;
				}
			}
	}
	return 0;	
	
}