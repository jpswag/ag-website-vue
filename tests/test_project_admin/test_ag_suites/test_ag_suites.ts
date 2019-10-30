import { config, mount, Wrapper } from '@vue/test-utils';

import {
    AGTestCase,
    AGTestCommand,
    AGTestSuite,
    HttpError,
    Project,
} from 'ag-client-typescript';
// tslint:disable-next-line:no-duplicate-imports
import * as ag_cli from 'ag-client-typescript';
import * as sinon from "sinon";

import APIErrors from '@/components/api_errors.vue';
import AGSuites from '@/components/project_admin/ag_suites/ag_suites.vue';
import { deep_copy } from '@/utils';

import * as data_ut from '@/tests/data_utils';
import {
    get_validated_input_text,
    set_validated_input_text,
    validated_input_is_valid
} from '@/tests/utils';

function make_wrapper(project: Project) {
    let wrapper = mount(AGSuites, {
        propsData: {
            project: project
        }
    });
    return wrapper;
}

describe('creating ag_test_suite', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve([]));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('d_new_ag_test_suite_name binding', async () => {
        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(false);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(false);

        wrapper.find('#add-ag-test-suite-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(true);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(true);

        let d_new_ag_test_suite_name_input = wrapper.find({ref: 'new_ag_test_suite_name'});

        set_validated_input_text(d_new_ag_test_suite_name_input, "Suite I");
        expect(validated_input_is_valid(d_new_ag_test_suite_name_input)).toBe(true);
        expect(wrapper.vm.d_new_ag_test_suite_name).toEqual("Suite I");

        wrapper.vm.d_new_ag_test_suite_name = "Suite II";
        expect(get_validated_input_text(d_new_ag_test_suite_name_input)).toEqual("Suite II");
    });

    test('Creating a suite - successfully', async () => {
        let create_ag_suite_stub = sinon.stub(AGTestSuite, 'create').callsFake(
            () => AGTestSuite.notify_ag_test_suite_created(new_suite)
        );

        let new_suite = data_ut.make_ag_test_suite(project.pk);

        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(false);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(false);

        wrapper.find('#add-ag-test-suite-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(true);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(true);
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(0);

        wrapper.vm.d_new_ag_test_suite_name = "Sweet";
        wrapper.find('#add-ag-test-suite-form').trigger('submit');
        await wrapper.vm.$nextTick();

        expect(create_ag_suite_stub.calledOnce).toBe(true);
        expect(wrapper.vm.d_new_ag_test_suite_name).toBe("");
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(1);
        expect(wrapper.vm.d_active_ag_test_suite).toEqual(new_suite);
        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(false);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(false);
    });

    test('Creating a suite - unsuccessfully', async () => {
        let create_ag_suite_stub = sinon.stub(AGTestSuite, 'create').returns(
            Promise.reject(
                new HttpError(
                    400,
                    {__all__: "Ag test suite with this Name and Project already exists."}
                )
            )
        );

        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(false);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(false);

        wrapper.find('#add-ag-test-suite-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(true);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(true);
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(0);

        wrapper.vm.d_new_ag_test_suite_name = "Sweet";
        wrapper.find('#add-ag-test-suite-form').trigger('submit');
        await wrapper.vm.$nextTick();

        expect(create_ag_suite_stub.calledOnce).toBe(true);
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(0);

        let api_errors = <APIErrors> wrapper.find({ref: 'api_errors'}).vm;
        expect(api_errors.d_api_errors.length).toBe(1);
        expect(wrapper.vm.d_show_new_ag_test_suite_modal).toBe(true);
        expect(wrapper.find({ref: 'new_ag_test_suite_modal'}).exists()).toBe(true);
    });
});

describe('ag_test_suite changed', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;
    let suite: AGTestSuite;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        suite = data_ut.make_ag_test_suite(project.pk);

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve([suite]));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('Suite changed', async () => {
        let updated_suite = deep_copy(suite, AGTestSuite);
        updated_suite.name = 'Updated name';

        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(suite);
        expect(wrapper.vm.d_ag_test_suites[0]).not.toEqual(updated_suite);

        AGTestSuite.notify_ag_test_suite_changed(updated_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0]).not.toEqual(suite);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(updated_suite);
        expect(wrapper.vm.d_ag_test_suites[0].name).toEqual(updated_suite.name);
    });
});

describe('deleting ag_test_suite', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;
    let first_suite: AGTestSuite;
    let middle_suite: AGTestSuite;
    let last_suite: AGTestSuite;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        first_suite = data_ut.make_ag_test_suite(project.pk);
        middle_suite = data_ut.make_ag_test_suite(project.pk);
        last_suite = data_ut.make_ag_test_suite(project.pk);

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(
            Promise.resolve(
                [
                    first_suite,
                    middle_suite,
                    last_suite
                ]
            )
        );

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('Delete first suite in suites', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        AGTestSuite.notify_ag_test_suite_deleted(first_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(middle_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(last_suite);
    });

    test('Delete active first suite in suites', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        wrapper.vm.update_active_item(first_suite);
        await wrapper.vm.$nextTick();

        AGTestSuite.notify_ag_test_suite_deleted(first_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_suite!.pk).toEqual(middle_suite.pk);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(middle_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(last_suite);
    });

    test('Delete last suite in suites', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        AGTestSuite.notify_ag_test_suite_deleted(last_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(first_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(middle_suite);
    });

    test('Delete active last suite in suites', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        wrapper.vm.update_active_item(last_suite);
        await wrapper.vm.$nextTick();

        AGTestSuite.notify_ag_test_suite_deleted(last_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_suite!.pk).toEqual(middle_suite.pk);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(first_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(middle_suite);
    });

    test('Delete middle suite in suites', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        AGTestSuite.notify_ag_test_suite_deleted(middle_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(first_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(last_suite);
    });

    test('Delete active middle suite in suites', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        wrapper.vm.update_active_item(middle_suite);
        await wrapper.vm.$nextTick();

        AGTestSuite.notify_ag_test_suite_deleted(middle_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_suite!.pk).toEqual(last_suite.pk);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(first_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(last_suite);
    });

    test('Delete all suites - active_suite gets set to null', async () => {
        expect(wrapper.vm.d_ag_test_suites.length).toEqual(3);

        wrapper.vm.update_active_item(first_suite);
        await wrapper.vm.$nextTick();

        AGTestSuite.notify_ag_test_suite_deleted(first_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(middle_suite);
        expect(wrapper.vm.d_ag_test_suites[1]).toEqual(last_suite);

        AGTestSuite.notify_ag_test_suite_deleted(middle_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(1);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(last_suite);

        AGTestSuite.notify_ag_test_suite_deleted(last_suite);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites.length).toEqual(0);
        expect(wrapper.vm.d_active_ag_test_suite).toBe(null);
    });
});

describe('creating ag_test_case', () => {
    let wrapper: Wrapper<AGSuites>;
    let ag_test_suite: AGTestSuite;
    let project: Project;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        ag_test_suite = data_ut.make_ag_test_suite(project.pk);

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [ag_test_suite]
        ));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('Case created', async () => {
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(ag_test_suite);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(0);

        let ag_test_case = data_ut.make_ag_test_case(ag_test_suite.pk);
        AGTestCase.notify_ag_test_case_created(ag_test_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(1);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(ag_test_case);
    });
});

describe('ag_test_case changed', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;
    let ag_test_suite: AGTestSuite;
    let ag_test_case: AGTestCase;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        ag_test_suite = data_ut.make_ag_test_suite(project.pk);
        ag_test_case = data_ut.make_ag_test_case(ag_test_suite.pk);
        ag_test_case.ag_test_commands = [data_ut.make_ag_test_command(ag_test_case.pk)];
        ag_test_suite.ag_test_cases = [ag_test_case];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [ag_test_suite]
        ));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('Case changed', async () => {
        let updated_ag_test_case = deep_copy(ag_test_case, AGTestCase);
        updated_ag_test_case.name = 'Updated name';

        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(ag_test_suite);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(1);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(ag_test_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).not.toEqual(updated_ag_test_case);

        AGTestCase.notify_ag_test_case_changed(updated_ag_test_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(1);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(updated_ag_test_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).not.toEqual(ag_test_case);
    });
});

describe('cloning ag_test_case', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;
    let suite: AGTestSuite;
    let case_to_clone: AGTestCase;
    let clone_of_case: AGTestCase;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        suite = data_ut.make_ag_test_suite(project.pk);
        case_to_clone = data_ut.make_ag_test_case(suite.pk);
        case_to_clone.ag_test_commands = [data_ut.make_ag_test_command(case_to_clone.pk)];
        suite.ag_test_cases = [case_to_clone];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [suite]
        ));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('Clone an ag test case', async () => {
        let new_case_name = "New Case Name";
        clone_of_case = data_ut.make_ag_test_case(suite.pk, { name: new_case_name });

        let clone_case_stub = sinon.stub(case_to_clone, 'copy').callsFake(
            () => AGTestCase.notify_ag_test_case_created(clone_of_case)
        );

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(1);

        wrapper.vm.update_active_item(case_to_clone);
        await wrapper.vm.$nextTick();

        wrapper.find('#ag-test-case-menu').trigger('click');
        await wrapper.vm.$nextTick();

        let case_to_clone_panel = wrapper.findAll('#ag-test-case-panel').at(0);
        case_to_clone_panel.find({ref: 'clone_ag_test_case_menu_item'}).trigger('click');
        await wrapper.vm.$nextTick();

        let ag_test_case_clone_name = case_to_clone_panel.find(
            {ref: 'ag_test_case_clone_name'}
        );
        set_validated_input_text(ag_test_case_clone_name, new_case_name);

        case_to_clone_panel.find('#clone-ag-test-case-form').trigger('submit');
        await wrapper.vm.$nextTick();

        expect(clone_case_stub.calledOnce).toBe(true);
        expect(clone_case_stub.firstCall.calledWith(new_case_name)).toBe(true);
        expect(clone_case_stub.calledOn(case_to_clone)).toBe(true);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(clone_of_case);
    });
});

describe('deleting ag_test_case', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;
    let suite: AGTestSuite;
    let first_case: AGTestCase;
    let middle_case: AGTestCase;
    let last_case: AGTestCase;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        suite = data_ut.make_ag_test_suite(project.pk);
        first_case = data_ut.make_ag_test_case(suite.pk);
        middle_case = data_ut.make_ag_test_case(suite.pk);
        last_case = data_ut.make_ag_test_case(suite.pk);

        first_case.ag_test_commands = [data_ut.make_ag_test_command(first_case.pk)];
        middle_case.ag_test_commands = [data_ut.make_ag_test_command(middle_case.pk)];
        last_case.ag_test_commands = [data_ut.make_ag_test_command(last_case.pk)];

        suite.ag_test_cases = [
          first_case,
          middle_case,
          last_case
        ];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [suite]
        ));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('First case deleted', async () => {
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(suite);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        AGTestCase.notify_ag_test_case_deleted(first_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(middle_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(last_case);
    });

    test('active first case deleted', async () => {
        wrapper.vm.update_active_item(first_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(first_case.ag_test_commands[0]);
        expect(wrapper.vm.d_ag_test_suites[0]).toEqual(suite);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        AGTestCase.notify_ag_test_case_deleted(first_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(middle_case.ag_test_commands[0]);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(middle_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(last_case);
    });

    test('Middle case deleted', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        AGTestCase.notify_ag_test_case_deleted(middle_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(first_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(last_case);
    });

    test('Active middle case deleted', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        wrapper.vm.update_active_item(middle_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(middle_case.ag_test_commands[0]);

        AGTestCase.notify_ag_test_case_deleted(middle_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(last_case.ag_test_commands[0]);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(first_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(last_case);
    });

    test('last case deleted', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        AGTestCase.notify_ag_test_case_deleted(last_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(first_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(middle_case);
    });

    test('active last case deleted', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        wrapper.vm.update_active_item(last_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(last_case.ag_test_commands[0]);

        AGTestCase.notify_ag_test_case_deleted(last_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(middle_case.ag_test_commands[0]);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(first_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(middle_case);
    });

    test('Delete all cases in suite - suite becomes active', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(3);

        wrapper.vm.update_active_item(first_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(first_case.ag_test_commands[0]);

        AGTestCase.notify_ag_test_case_deleted(first_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(middle_case);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[1]).toEqual(last_case);
        expect(wrapper.vm.d_active_ag_test_suite).toBeNull();
        expect(wrapper.vm.d_active_ag_test_command).toEqual(middle_case.ag_test_commands[0]);

        AGTestCase.notify_ag_test_case_deleted(middle_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(1);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0]).toEqual(last_case);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(last_case.ag_test_commands[0]);

        AGTestCase.notify_ag_test_case_deleted(last_case);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases.length).toEqual(0);
        expect(wrapper.vm.d_active_ag_test_command).toBeNull();
        expect(wrapper.vm.d_active_ag_test_suite).toEqual(suite);
    });
});

describe('ag_test_command Created', () => {
    test('Command created', async () => {
        let project = data_ut.make_project(data_ut.make_course().pk);
        let suite_1 = data_ut.make_ag_test_suite(project.pk);
        let suite_1_case_1 = data_ut.make_ag_test_case(suite_1.pk);
        let suite_1_case_1_command_1 = data_ut.make_ag_test_command(suite_1_case_1.pk);

        suite_1_case_1.ag_test_commands = [suite_1_case_1_command_1];
        suite_1.ag_test_cases = [suite_1_case_1];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [suite_1]
        ));

        let wrapper = make_wrapper(project);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(1);

        let command_created = data_ut.make_ag_test_command(suite_1_case_1.pk);
        AGTestCommand.notify_ag_test_command_created(command_created);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            suite_1_case_1_command_1
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            command_created
        );
        expect(wrapper.vm.d_active_ag_test_command).toEqual(command_created);

        sinon.restore();
        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });
});

describe('ag_test_command Changed', () => {
    test('Command changed', async () => {
        let project: Project;

        let suite_1: AGTestSuite;
        let case_1: AGTestCase;
        let command_1: AGTestCommand;
        let command_2: AGTestCommand;

        project = data_ut.make_project(data_ut.make_course().pk);
        suite_1 = data_ut.make_ag_test_suite(project.pk);
        case_1 = data_ut.make_ag_test_case(suite_1.pk);
        command_1 = data_ut.make_ag_test_command(case_1.pk);
        command_2 = data_ut.make_ag_test_command(case_1.pk);

        case_1.ag_test_commands = [command_1, command_2];
        suite_1.ag_test_cases = [case_1];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(
            Promise.resolve([])
        );
        sinon.stub(AGTestSuite, 'get_all_from_project').resolves([suite_1]);

        let wrapper = make_wrapper(project);
        await wrapper.vm.$nextTick();

        let updated_command_2 = deep_copy(command_2, AGTestCommand);
        updated_command_2.name = 'Updated name';

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            command_1
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            command_2
        );
        expect(command_2).not.toEqual(updated_command_2);
        AGTestCommand.notify_ag_test_command_changed(updated_command_2);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            command_1
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            updated_command_2
        );
        sinon.restore();
        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });
});

describe('ag_test_command Deleted', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;

    let parent_suite: AGTestSuite;
    let parent_case: AGTestCase;
    let first_command: AGTestCommand;
    let middle_command: AGTestCommand;
    let last_command: AGTestCommand;


    beforeEach(async () => {
        project = data_ut.make_project(data_ut.make_course().pk);
        parent_suite = data_ut.make_ag_test_suite(project.pk);
        parent_case = data_ut.make_ag_test_case(parent_suite.pk);
        first_command = data_ut.make_ag_test_command(parent_case.pk);
        middle_command = data_ut.make_ag_test_command(parent_case.pk);
        last_command = data_ut.make_ag_test_command(parent_case.pk);

        parent_case.ag_test_commands = [
            first_command,
            middle_command,
            last_command
        ];

        parent_suite.ag_test_cases = [parent_case];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(
            Promise.resolve([])
        );

        sinon.stub(AGTestSuite, 'get_all_from_project').resolves([parent_suite]);

        wrapper = make_wrapper(project);
        await wrapper.vm.$nextTick();
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('First command deleted in case', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(3);
        AGTestCommand.notify_ag_test_command_deleted(first_command);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            middle_command
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            last_command
        );
    });

    test('active First command deleted in case', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(3);

        wrapper.vm.update_active_item(first_command);
        await wrapper.vm.$nextTick();
        AGTestCommand.notify_ag_test_command_deleted(first_command);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(middle_command);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            middle_command
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            last_command
        );
    });

    test('Middle command deleted in case', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(3);
        AGTestCommand.notify_ag_test_command_deleted(middle_command);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            first_command
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            last_command
        );
    });

    test('Active middle command deleted in case', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(3);

        wrapper.vm.update_active_item(middle_command);
        await wrapper.vm.$nextTick();
        AGTestCommand.notify_ag_test_command_deleted(middle_command);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(last_command);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            first_command
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            last_command
        );
    });

    test('Last command deleted in case', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(3);
        AGTestCommand.notify_ag_test_command_deleted(last_command);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            first_command
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            middle_command
        );
    });

    test('Active last command deleted in case', async () => {
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(3);

        wrapper.vm.update_active_item(last_command);
        await wrapper.vm.$nextTick();
        AGTestCommand.notify_ag_test_command_deleted(last_command);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands.length).toEqual(2);
        expect(wrapper.vm.d_active_ag_test_command).toEqual(middle_command);
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[0]).toEqual(
            first_command
        );
        expect(wrapper.vm.d_ag_test_suites[0].ag_test_cases[0].ag_test_commands[1]).toEqual(
            middle_command
        );
    });
});

describe('prev_ag_test_case_is_available and go_to_prev_command', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;

    let suite_1: AGTestSuite;
    let suite_1_case_1: AGTestCase;
    let suite_1_case_1_command_1: AGTestCommand;
    let suite_1_case_2: AGTestCase;
    let suite_1_case_2_command_1: AGTestCommand;
    let suite_1_case_2_command_2: AGTestCommand;

    let suite_2: AGTestSuite;
    let suite_2_case_1: AGTestCase;
    let suite_2_case_1_command_1: AGTestCommand;
    let suite_2_case_1_command_2: AGTestCommand;

    let suite_3: AGTestSuite;
    let suite_3_case_1: AGTestCase;
    let suite_3_case_1_command_1: AGTestCommand;

    beforeEach(async () => {
        project = data_ut.make_project(data_ut.make_course().pk);
        suite_1 = data_ut.make_ag_test_suite(project.pk);
        suite_1_case_1 = data_ut.make_ag_test_case(suite_1.pk);
        suite_1_case_1_command_1 = data_ut.make_ag_test_command(suite_1_case_1.pk);
        suite_1_case_2 = data_ut.make_ag_test_case(suite_1.pk);
        suite_1_case_2_command_1 = data_ut.make_ag_test_command(suite_1_case_2.pk);
        suite_1_case_2_command_2 = data_ut.make_ag_test_command(suite_1_case_2.pk);

        suite_1_case_1.ag_test_commands = [suite_1_case_1_command_1];
        suite_1_case_2.ag_test_commands = [suite_1_case_2_command_1, suite_1_case_2_command_2];
        suite_1.ag_test_cases = [suite_1_case_1, suite_1_case_2];

        suite_2 = data_ut.make_ag_test_suite(project.pk);
        suite_2_case_1 = data_ut.make_ag_test_case(suite_2.pk);
        suite_2_case_1_command_1 = data_ut.make_ag_test_command(suite_2_case_1.pk);
        suite_2_case_1_command_2 = data_ut.make_ag_test_command(suite_2_case_1.pk);

        suite_2_case_1.ag_test_commands = [suite_2_case_1_command_1, suite_2_case_1_command_2];
        suite_2.ag_test_cases = [suite_2_case_1];

        suite_3 = data_ut.make_ag_test_suite(project.pk);
        suite_3_case_1 = data_ut.make_ag_test_case(suite_3.pk);
        suite_3_case_1_command_1 = data_ut.make_ag_test_command(suite_3_case_1.pk);

        suite_3_case_1.ag_test_commands = [suite_3_case_1_command_1];
        suite_3.ag_test_cases = [suite_3_case_1];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [suite_1, suite_2, suite_3]
        ));

        wrapper = make_wrapper(project);
        await wrapper.vm.$nextTick();
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('prev_ag_test_case_is_available (false) - d_active_ag_test_suite is null', async () => {
        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(false);
        expect(wrapper.findAll('#prev-ag-test-case-button').length).toEqual(0);
    });

    test('prev_ag_test_case_is_available (false) - d_active_ag_test_command is null', async () => {
        wrapper.vm.update_active_item(suite_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(false);
        expect(wrapper.findAll('#prev-ag-test-case-button').length).toEqual(0);
    });

    test('prev_ag_test_case_is_available (false) - suite index is 0, case index is 0', async () => {
        wrapper.vm.update_active_item(suite_1_case_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test('prev_ag_test_case_is_available (false) - suite index != 0, case index is 0, ' +
         'prev suite doesnt have any cases',
         async () => {
        AGTestCase.notify_ag_test_case_deleted(suite_2_case_1);
        await wrapper.vm.$nextTick();

        wrapper.vm.update_active_item(suite_3_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test("prev_ag_test_case_is_available (false) - suite index != 0, case index is 0, " +
         "prev suite's last case doesnt have enough commands",
         async () => {
        AGTestCommand.notify_ag_test_command_deleted(suite_1_case_2_command_2);
        await wrapper.vm.$nextTick();

        wrapper.vm.update_active_item(suite_2_case_1_command_2);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test("prev_ag_test_case_is_available (true) - suite index != 0, case index is 0, " +
         "prev suite's last case has enough commands",
         async () => {
        wrapper.vm.update_active_item(suite_3_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(true);
        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(false);
    });

    test('prev_ag_test_case_is_available (false) - suite index is 0, case index != 0, ' +
         'prev case does not have enough commands',
         async () => {
        wrapper.vm.update_active_item(suite_1_case_2_command_2);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test('prev_ag_test_case_is_available (true) - suite index is 0, case index != 0, prev ' +
         'case has enough commands',
         async () => {
        wrapper.vm.update_active_item(suite_1_case_2_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.prev_ag_test_case_is_available).toBe(true);
        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(false);
    });

    test('go_to_prev_command - prev case in same suite', async () => {
        wrapper.vm.update_active_item(suite_1_case_2_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_1_case_2_command_1);

        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(false);
        wrapper.find('#prev-ag-test-case-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_1_case_1_command_1);
    });

    test('go_to_prev_command - last case in previous suite', async () => {
        wrapper.vm.update_active_item(suite_2_case_1_command_2);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_2_case_1_command_2);

        expect(wrapper.find('#prev-ag-test-case-button').is('[disabled]')).toBe(false);
        wrapper.find('#prev-ag-test-case-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_1_case_2_command_2);
    });
});

describe('next_ag_test_case_is_available AND go_to_next_command', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;

    let suite_1: AGTestSuite;
    let suite_1_case_1: AGTestCase;
    let suite_1_case_1_command_1: AGTestCommand;
    let suite_1_case_2: AGTestCase;
    let suite_1_case_2_command_1: AGTestCommand;
    let suite_1_case_2_command_2: AGTestCommand;

    let suite_2: AGTestSuite;
    let suite_2_case_1: AGTestCase;
    let suite_2_case_1_command_1: AGTestCommand;
    let suite_2_case_1_command_2: AGTestCommand;

    let suite_3: AGTestSuite;
    let suite_3_case_1: AGTestCase;
    let suite_3_case_1_command_1: AGTestCommand;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        suite_1 = data_ut.make_ag_test_suite(project.pk);
        suite_1_case_1 = data_ut.make_ag_test_case(suite_1.pk);
        suite_1_case_1_command_1 = data_ut.make_ag_test_command(suite_1_case_1.pk);
        suite_1_case_2 = data_ut.make_ag_test_case(suite_1.pk);
        suite_1_case_2_command_1 = data_ut.make_ag_test_command(suite_1_case_2.pk);
        suite_1_case_2_command_2 = data_ut.make_ag_test_command(suite_1_case_2.pk);

        suite_1_case_1.ag_test_commands = [suite_1_case_1_command_1];
        suite_1_case_2.ag_test_commands = [suite_1_case_2_command_1, suite_1_case_2_command_2];
        suite_1.ag_test_cases = [suite_1_case_1, suite_1_case_2];

        suite_2 = data_ut.make_ag_test_suite(project.pk);
        suite_2_case_1 = data_ut.make_ag_test_case(suite_2.pk);
        suite_2_case_1_command_1 = data_ut.make_ag_test_command(suite_2_case_1.pk);
        suite_2_case_1_command_2 = data_ut.make_ag_test_command(suite_2_case_1.pk);

        suite_2_case_1.ag_test_commands = [suite_2_case_1_command_1, suite_2_case_1_command_2];
        suite_2.ag_test_cases = [suite_2_case_1];

        suite_3 = data_ut.make_ag_test_suite(project.pk);
        suite_3_case_1 = data_ut.make_ag_test_case(suite_3.pk);
        suite_3_case_1_command_1 = data_ut.make_ag_test_command(suite_3_case_1.pk);

        suite_3_case_1.ag_test_commands = [suite_3_case_1_command_1];
        suite_3.ag_test_cases = [suite_3_case_1];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));
        sinon.stub(AGTestSuite, 'get_all_from_project').returns(Promise.resolve(
            [suite_1, suite_2, suite_3]
        ));

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('next_ag_test_case_is_available (false) - d_active_ag_test_suite is null',
         async () => {
        expect(wrapper.vm.next_ag_test_case_is_available).toBe(false);
        expect(wrapper.findAll('#next-ag-test-case-button').length).toEqual(0);
    });

    test('next_ag_test_case_is_available (false) - d_active_ag_test_command is null',
         async () => {
        wrapper.vm.update_active_item(suite_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(false);
        expect(wrapper.findAll('#next-ag-test-case-button').length).toEqual(0);
    });

    test('next_ag_test_case_is_available (false) - suite index is 0, case index is 0, ' +
         'next case doesnt have enough commands',
         async () => {
        let suite_1_case_1_command_2 = data_ut.make_ag_test_command(suite_1_case_1.pk);
        let suite_1_case_1_command_3 = data_ut.make_ag_test_command(suite_1_case_1.pk);

        AGTestCommand.notify_ag_test_command_created(suite_1_case_1_command_2);
        AGTestCommand.notify_ag_test_command_created(suite_1_case_1_command_3);

        wrapper.vm.update_active_item(suite_1_case_1_command_3);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test('next_ag_test_case_is_available (true) - suite index is 0, case index is 0, next ' +
         'case has enough commands',
         async () => {
        wrapper.vm.update_active_item(suite_1_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(true);
        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(false);
    });

    test('next_ag_test_case_is_available (false) - suite is the last suite, case is the ' +
         'last case in the suite',
         async () => {
        wrapper.vm.update_active_item(suite_3_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test('next_ag_test_case_is_available (false) - suite is not the last suite, ' +
         'case is the last case in the suite, next suite doesnt have any cases',
         async () => {
        AGTestCase.notify_ag_test_case_deleted(suite_3_case_1);

        wrapper.vm.update_active_item(suite_2_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test('next_ag_test_case_is_available (false) - suite is not the last suite, case is ' +
         'the last case in the suite, first case in next suite doesnt have enough commands',
         async () => {
        wrapper.vm.update_active_item(suite_2_case_1_command_2);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(false);
        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(true);
    });

    test('next_ag_test_case_is_available (true) - suite is not the last suite, case is' +
         'the last case in the suite, first case in the next suite has enough commands',
         async () => {
        wrapper.vm.update_active_item(suite_2_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.next_ag_test_case_is_available).toBe(true);
        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(false);
    });

    test('go_to_next_command - next case in same suite', async () => {
        wrapper.vm.update_active_item(suite_1_case_1_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_1_case_1_command_1);

        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(false);
        wrapper.find('#next-ag-test-case-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_1_case_2_command_1);
    });

    test('go_to_next_command - first case in next suite', async () => {
        wrapper.vm.update_active_item(suite_1_case_2_command_2);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_1_case_2_command_2);

        expect(wrapper.find('#next-ag-test-case-button').is('[disabled]')).toBe(false);
        wrapper.find('#next-ag-test-case-button').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_active_ag_test_command).toEqual(suite_2_case_1_command_2);
    });
});

describe('active_level', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;

    let ag_test_suite: AGTestSuite;
    let ag_test_case: AGTestCase;
    let ag_test_command: AGTestCommand;


    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
        ag_test_suite = data_ut.make_ag_test_suite(project.pk);
        ag_test_case = data_ut.make_ag_test_case(ag_test_suite.pk);
        ag_test_command = data_ut.make_ag_test_command(ag_test_case.pk);

        ag_test_case.ag_test_commands = [ag_test_command];
        ag_test_suite.ag_test_cases = [ag_test_case];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(
            Promise.resolve([])
        );

        sinon.stub(AGTestSuite, 'get_all_from_project').resolves([ag_test_suite]);

        wrapper = make_wrapper(project);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('active_level_is_suite', async () => {
        expect(wrapper.vm.active_level_is_suite).toBe(false);

        wrapper.vm.update_active_item(ag_test_suite);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.active_level_is_suite).toBe(true);

        wrapper.vm.update_active_item(ag_test_case);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.active_level_is_suite).toBe(false);

        wrapper.vm.update_active_item(ag_test_command);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.active_level_is_suite).toBe(false);
    });

    test('active_level_is_command', async () => {
        expect(wrapper.vm.active_level_is_command).toBe(false);

        wrapper.vm.update_active_item(ag_test_suite);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.active_level_is_command).toBe(false);

        wrapper.vm.update_active_item(ag_test_case);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.active_level_is_command).toBe(true);

        wrapper.vm.update_active_item(ag_test_command);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.active_level_is_command).toBe(true);
    });
});

describe('AGSuites getter functions', () => {
    let wrapper: Wrapper<AGSuites>;
    let project: Project;

    beforeEach(() => {
        project = data_ut.make_project(data_ut.make_course().pk);
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('parent_ag_test_case getter', async () => {
        let suite_1 = data_ut.make_ag_test_suite(project.pk);
        let suite_1_case_1 = data_ut.make_ag_test_case(suite_1.pk);
        let suite_1_case_1_command_1 = data_ut.make_ag_test_command(suite_1_case_1.pk);
        let suite_1_case_2 = data_ut.make_ag_test_case(suite_1.pk);
        let suite_1_case_2_command_1 = data_ut.make_ag_test_command(suite_1_case_2.pk);

        suite_1_case_1.ag_test_commands = [suite_1_case_1_command_1];
        suite_1_case_2.ag_test_commands = [ suite_1_case_2_command_1];
        suite_1.ag_test_cases = [suite_1_case_1, suite_1_case_2];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));

        sinon.stub(AGTestSuite, 'get_all_from_project').returns(
            Promise.resolve([suite_1])
        );

        wrapper = make_wrapper(project);

        expect(wrapper.vm.parent_ag_test_case).toBeNull();

        wrapper.vm.update_active_item(suite_1_case_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.parent_ag_test_case).toEqual(suite_1_case_1);

        wrapper.vm.update_active_item(suite_1_case_2_command_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.parent_ag_test_case).toEqual(suite_1_case_2);
    });

    test('parent_ag_test_suite getter', async () => {
        let suite_1 = data_ut.make_ag_test_suite(project.pk);
        let suite_1_case_1 = data_ut.make_ag_test_case(suite_1.pk);
        let suite_1_case_1_command_1 = data_ut.make_ag_test_command(suite_1_case_1.pk);
        let suite_2 = data_ut.make_ag_test_suite(project.pk);
        let suite_2_case_1 = data_ut.make_ag_test_case(suite_2.pk);
        let suite_2_case_1_command_1 = data_ut.make_ag_test_command(suite_2_case_1.pk);

        suite_1_case_1.ag_test_commands = [suite_1_case_1_command_1];
        suite_2_case_1.ag_test_commands = [suite_2_case_1_command_1];

        suite_1.ag_test_cases = [suite_1_case_1];
        suite_2.ag_test_cases = [suite_2_case_1];

        sinon.stub(ag_cli, 'get_sandbox_docker_images').returns(Promise.resolve([]));

        sinon.stub(AGTestSuite, 'get_all_from_project').returns(
            Promise.resolve([suite_1, suite_2])
        );

        wrapper = make_wrapper(project);

        expect(wrapper.vm.parent_ag_test_suite).toBeNull();

        wrapper.vm.update_active_item(suite_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.parent_ag_test_suite).toBeNull();

        wrapper.vm.update_active_item(suite_1_case_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.parent_ag_test_suite).toEqual(suite_1);

        wrapper.vm.update_active_item(suite_2_case_1);
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.parent_ag_test_suite).toEqual(suite_2);
    });
});
