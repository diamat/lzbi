
exports.RoleAccess = function RoleAccess (role, action, menu, uid, cid) {
	switch(menu){
		case 'customers': 
			switch(action){
				case 'main': {
					if(role === 'manager' || role === 'bigboss') return 1;
					else return 0;
				} break; 
				case 'id': {
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 1;
					else return 0;
				} break; 
				case 'edit':{
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'bigboss') return 1;
					else return 0;
				}
			} break;
		case 'orders': 
			switch(action){
				case 'main': {
					if(role === 'manager' || role === 'bigboss') return 1;
					else return 0;
				} break; 
				case 'id': {
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 2;
					else return 0;
				} break; 
				case 'edit':{
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'bigboss') return 2;
					else return 0;
				}
			} break; 
		case 'buh': 
			switch(action){
				case 'main': {
					if(role === 'manager') return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 2;
					else return 0;
				} break; 
				case 'id': {
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 2;
					else return 0;
				} break; 
				case 'print': {
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 2;
					else return 0;
				}
				case 'edit':{
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'bigboss') return 2;
					else return 0;
				} break; 
				case 'date':{
					if(role === 'manager') return 1;
					if(role === 'bigboss' || role === 'buhmanager') return 2;
					else return 0;
				}
			} break; 
		case 'shipment': 
			switch(action){
				case 'main': {
					if(role === 'manager') return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 2;
					else return 0;
				} break; 
				case 'id': {
					if(role === 'manager' && uid == cid) return 1;
					if(role === 'buhmanager') return 1.5;
					if(role === 'bigboss') return 2;
					else return 0;
				} 
			} break; 
		case 'providers': 
			switch(action){
				case 'main': {
					if(role === 'bigboss') return 1;
					else return 0;
				} break; 
				case 'id': {
					if(role === 'bigboss') return 1;
					else return 0;
				} break; 
				case 'edit':{
					if(role === 'bigboss') return 1;
					else return 0;
				}
			}
	}
	return 0;	
	
}