import { Agreement } from "./agreement";
import { BpiSubject } from "./bpiSubject";
import { Workstep } from "./workstep";

export class Workgroup {
     id: string;
     name: string;
     participants: BpiSubject[] = [];
     worksteps: Workstep[] = [];

     constructor(worksteps: Workstep[]) {
          this.worksteps = worksteps;
     }
     addWorkstep(workstep: Workstep){
          this.worksteps.push(workstep);
     }
     addParticipants(bpiSubject:BpiSubject){
         this.participants.push(bpiSubject);
     }
     getParticipantsById(id:string):BpiSubject{
         const orgs = this.participants.filter(org=>org.id === id);

         return orgs[0];
     }
}
