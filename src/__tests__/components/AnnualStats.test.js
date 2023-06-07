import '@testing-library/jest-dom'

import {render, screen} from '@testing-library/react'

import AnnualStats from '../../components/AnnualStats'

const populatedTestData = {
    "total_walk_miles": 77.07190007395839,
    "total_run_miles": 46.8640017119976,
    "average_run_speed": "12:56",
    "average_walk_speed": "25:52",
    "first_name": "Ali"
}

const newUserTestData = {
    "total_walk_miles": 0,
    "total_run_miles": 0,
    "average_run_speed": null,
    "average_walk_speed": null,
    "first_name": "Ali"
}

describe(("AnnualStats"), () => {
    test("handles new user", async () => {
        await render(<AnnualStats data={newUserTestData} />)
        const cells = await screen.findAllByRole("cell")
        expect(cells[0]).toHaveTextContent("Total stroller run miles")
        expect(cells[1]).toHaveTextContent("0.00")
        expect(cells[2]).toHaveTextContent("Total stroller walk miles")
        expect(cells[3]).toHaveTextContent("0.00")
        expect(cells[4]).toHaveTextContent("Average run pace with stroller")
        expect(cells[5]).toHaveTextContent("N/A")
        expect(cells[6]).toHaveTextContent("Average walk pace with stroller")
        expect(cells[7]).toHaveTextContent("N/A")
    })

    test("handles user with populated data", async () => {
        await render(<AnnualStats data={populatedTestData} />)
        const cells = await screen.findAllByRole("cell")
        expect(cells[0]).toHaveTextContent("Total stroller run miles")
        expect(cells[1]).toHaveTextContent("46.86")
        expect(cells[2]).toHaveTextContent("Total stroller walk miles")
        expect(cells[3]).toHaveTextContent("77.07")
        expect(cells[4]).toHaveTextContent("Average run pace with stroller")
        expect(cells[5]).toHaveTextContent("12:56 min/mile")
        expect(cells[6]).toHaveTextContent("Average walk pace with stroller")
        expect(cells[7]).toHaveTextContent("25:52 min/mile")
    })
})
